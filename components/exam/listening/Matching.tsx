"use client";

import { Label } from "@/components/ui/label";
import { useCurrentExamSection } from "@/hooks/useCurrentExamSection";
import { QuestionHandlers, STORAGE_KEYS } from "@/lib/answerHandlers";
import { cn } from "@/lib/utils";
import { processTextWithBoldAndCaps } from "@/utils/highlightAsBold";
import { Ref, useCallback, useEffect, useMemo, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type Variant = {
  variant?: string;
  text: string;
  label: string;
};

type Pair = {
  number: string;
  item: string;
  isInteractive: boolean;
  match?: string;
};

type Props = {
  data: {
    questionStart: string;
    questionEnd: string;
    instructions: string[];
    pairs: Pair[];
    options: Variant[];
    headline?: string;
    optionsHeadline?: string;
    optionsAtATime?: string | number | null;
    type?: string;
  };
  onAnswerChange: (
    newAnswers:
      | Record<string, string>
      | Array<{ number: number; answer: string }>
  ) => void;
  userAnswers: Record<string, string>;
};

type DragItem = {
  type: "option";
  variant: string;
  from?: string; // 'pool' OR question number (as string)
};

export default function MatchingExam({
  data,
  onAnswerChange,
  userAnswers,
}: Props) {
  const currentSection = useCurrentExamSection();
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(
    userAnswers || {}
  );
  const [hasRestored, setHasRestored] = useState(false);

  // option map (variant => text)
  const variantToText = useMemo(() => {
    const map: Record<string, string> = {};
    data.options.forEach((opt) => {
      const variant = opt.variant || opt.label;
      map[variant] = opt.text;
    });
    return map;
  }, [data.options]);

  const getTextForVariant = useCallback(
    (v?: string) => (v ? variantToText[v] || "" : ""),
    [variantToText]
  );

  // Helper to convert answers to format expected by createMatchingHandler
  const formatAnswersForHandler = useCallback(
    (answers: Record<string, string>) => {
      return Object.entries(answers).map(([qNum, answer]) => ({
        number: parseInt(qNum),
        answer: answer || "",
      }));
    },
    []
  );

  useEffect(() => {
    const storageKey =
      currentSection === "Listening"
        ? STORAGE_KEYS.LISTENING_ANSWERS
        : STORAGE_KEYS.READING_ANSWERS;

    const storedAnswers = JSON.parse(
      sessionStorage.getItem(storageKey) || "{}"
    );

    const start = parseInt(data.questionStart);
    const end = parseInt(data.questionEnd);
    const relevant: Record<string, string> = {};

    for (let i = start; i <= end; i++) {
      const key = String(i);
      if (storedAnswers[key]) {
        relevant[key] = storedAnswers[key];
      }
    }

    setLocalAnswers(relevant);
    setHasRestored(true); // ✅ allow syncing after initial restore

    onAnswerChange?.(formatAnswersForHandler(relevant));
  }, [formatAnswersForHandler]);

  // Sync localAnswers to sessionStorage whenever they change
  useEffect(() => {
    if (!hasRestored) return; // ⛔ don’t sync before restore

    const storageKey =
      currentSection === "Listening"
        ? STORAGE_KEYS.LISTENING_ANSWERS
        : STORAGE_KEYS.READING_ANSWERS;

    // Read existing storage and update it with the new localAnswers
    const current = JSON.parse(sessionStorage.getItem(storageKey) || "{}");

    const start = parseInt(data.questionStart);
    const end = parseInt(data.questionEnd);

    for (let i = start; i <= end; i++) {
      delete current[String(i)];
    }

    const updatedStorage = { ...current, ...localAnswers };

    sessionStorage.setItem(storageKey, JSON.stringify(updatedStorage));
    window.dispatchEvent(new Event("answersUpdated"));
  }, [
    localAnswers,
    currentSection,
    data.questionStart,
    data.questionEnd,
    hasRestored,
  ]);

  const optionsAtATime = useMemo(() => {
    const val = parseInt(data.optionsAtATime as string);
    return isNaN(val) || val <= 0 ? 1 : val;
  }, [data.optionsAtATime]);

  const optionUsageCount = useMemo(() => {
    const count: Record<string, number> = {};
    Object.values(localAnswers).forEach((answer) => {
      if (answer) {
        count[answer] = (count[answer] || 0) + 1;
      }
    });
    return count;
  }, [localAnswers]);

  const visibleOptions = useMemo(() => {
    return data.options.filter((option) => {
      const variant = option.variant || option.label;
      const used = optionUsageCount[variant] || 0;
      return used < optionsAtATime;
    });
  }, [data.options, optionUsageCount, optionsAtATime]);

  const handleDrop = (number: string, item: DragItem) => {
    setLocalAnswers((prev) => {
      const newAnswers = { ...prev };

      // Handle swapping: if target already has an answer, swap with source
      if (item.from && item.from !== "pool" && newAnswers[number]) {
        const targetAnswer = newAnswers[number];
        newAnswers[item.from] = targetAnswer;
        newAnswers[number] = item.variant;

        // Convert to format expected by createMatchingHandler
        onAnswerChange(formatAnswersForHandler(newAnswers));

        return newAnswers;
      }

      // if moving from another dropzone, clear the old one
      if (item.from && item.from !== "pool") {
        delete newAnswers[item.from];
      }

      // prevent duplicate usage if over limit
      if (optionsAtATime <= 1) {
        for (const key in newAnswers) {
          if (newAnswers[key] === item.variant) {
            delete newAnswers[key];
          }
        }
      } else {
        const usage = Object.values(newAnswers).filter(
          (v) => v === item.variant
        ).length;
        if (usage >= optionsAtATime) return prev;
      }

      newAnswers[number] = item.variant;

      // Convert to format expected by createMatchingHandler
      onAnswerChange(formatAnswersForHandler(newAnswers));

      return newAnswers;
    });
  };

  const removeAnswer = useCallback(
    (number: string) => {
      setLocalAnswers((prev) => {
        const updated = { ...prev };
        delete updated[number];

        // Convert to format expected by createMatchingHandler
        onAnswerChange(formatAnswersForHandler(updated));

        return updated;
      });

      if (currentSection) {
        setTimeout(() => {
          QuestionHandlers.removeAnswer(currentSection, number);
        }, 0);
      }
    },
    [currentSection, onAnswerChange, formatAnswersForHandler]
  );

  // Handle return to pool event
  useEffect(() => {
    const handleReturnToPool = (event: CustomEvent) => {
      const { questionNumber } = event.detail;
      removeAnswer(questionNumber);
    };

    window.addEventListener(
      "returnToPool",
      handleReturnToPool as EventListener
    );
    return () => {
      window.removeEventListener(
        "returnToPool",
        handleReturnToPool as EventListener
      );
    };
  }, [removeAnswer]);

  const isSentenceEndings = data.type === "matching-sentence-endings";

  return (
    <DndProvider backend={HTML5Backend}>
      <Label className="text-sm mb-1">
        <div className="text-sm text-muted-foreground mb-4">
          Question {data.questionStart}–{data.questionEnd}
        </div>
        <div className="instructions space-y-2 mb-4">
          {data.instructions?.map((line, idx) => (
            <div key={idx} dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(line) }} />
          ))}
        </div>
      </Label>

      {/* Headline */}
      {data.headline && (
        <div className="text-center w-full flex items-center justify-center mb-4">
          <p className="font-bold" dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(data.headline) }} />
        </div>
      )}

      {/* layout switch */}
      {isSentenceEndings ? (
        <div className="space-y-4">
          {/* questions stacked vertically, no borders, number + text together */}
          {data.pairs.map((pair) => (
            <SentenceEndingDrop
              key={pair.number}
              number={pair.number}
              item={pair.item}
              answer={localAnswers[pair.number]}
              onDrop={handleDrop}
              onRemove={removeAnswer}
              getTextForVariant={getTextForVariant}
              isSentenceEndings={isSentenceEndings}
            />
          ))}

          <hr />

          {/* options list (vertical) - removed pool drop zone */}
          <div className="mt-3 flex flex-col gap-2">
            <p>{data.optionsHeadline}</p>
            {visibleOptions.length > 0 ? (
              visibleOptions.map((opt) => {
                const variant = opt.variant || opt.label;
                return (
                  <DraggableOption
                    key={variant}
                    variant={variant}
                    text={opt.text}
                    used={(optionUsageCount[variant] || 0) > 0}
                    origin="pool"
                    isInSentenceEnding={isSentenceEndings}
                  />
                );
              })
            ) : (
              <span className="text-sm text-muted-foreground italic">
                All options at capacity. Very popular bunch, aren’t they?
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="wrapper flex gap-4 items-start justify-between">
          <div className="space-y-4 w-[65%]">
            {data.pairs.map((pair) => (
              <DropTarget
                key={pair.number}
                number={pair.number}
                item={pair.item}
                answer={localAnswers[pair.number]}
                onDrop={handleDrop}
                onRemove={removeAnswer}
                getTextForVariant={getTextForVariant}
              />
            ))}
          </div>
          <div className="mb-4 flex flex-col flex-wrap gap-2">
            <p>{data.optionsHeadline}</p>
            {visibleOptions.length > 0 ? (
              visibleOptions.map((opt) => {
                const variant = opt.variant || opt.label;
                return (
                  <DraggableOption
                    key={variant}
                    variant={variant}
                    text={opt.text}
                    used={(optionUsageCount[variant] || 0) > 0}
                    origin="pool"
                    isInSentenceEnding={false}
                  />
                );
              })
            ) : (
              <span className="text-sm text-muted-foreground italic">
                All options at capacity. Very popular bunch, aren’t they?
              </span>
            )}
          </div>
        </div>
      )}
    </DndProvider>
  );
}

/* ---------- Draggable Option (used in pool + inside answers) ---------- */
function DraggableOption({
  variant,
  text,
  used,
  origin,
  isInSentenceEnding,
}: {
  variant: string;
  text: string;
  used: boolean;
  origin: string; // 'pool' or question number as string
  isInSentenceEnding?: boolean;
}) {
  const [{ isDragging }, drag] = useDrag({
    type: "option",
    item: { variant, from: origin },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // If dropped outside any valid drop zone, return to pool
      if (!monitor.didDrop() && item.from && item.from !== "pool") {
        // This will be handled by the parent component's removeAnswer
        setTimeout(() => {
          const removeEvent = new CustomEvent("returnToPool", {
            detail: { questionNumber: item.from },
          });
          window.dispatchEvent(removeEvent);
        }, 0);
      }
    },
  });

  return (
    <div
      ref={drag as unknown as Ref<HTMLDivElement>}
      className={`cursor-move border p-2 rounded bg-white shadow-sm ${
        used && origin === "pool" ? "line-through" : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {/* For sentence endings, show only text without variant label */}
      <span dangerouslySetInnerHTML={{ 
        __html: processTextWithBoldAndCaps(isInSentenceEnding && origin !== "pool" ? text : `${variant}. ${text}`) 
      }} />
    </div>
  );
}

/* ---------- Drop Target (default "matching") ---------- */
function DropTarget({
  number,
  item,
  answer,
  onDrop,
  onRemove,
  getTextForVariant,
}: {
  number: string;
  item: string;
  answer?: string;
  onDrop: (number: string, item: DragItem) => void;
  onRemove: (number: string) => void;
  getTextForVariant: (v?: string) => string;
}) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "option",
    drop: (item: DragItem) => onDrop(number, item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop as unknown as Ref<HTMLDivElement>}
      id={`qn-${number}`}
      className={cn(
        "border-2 transition-colors",
        isOver && canDrop ? "border-blue-500" : "border-muted",
        answer && "border-gray-500"
      )}
    >
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-muted-foreground">{number}</div>
          <div className="text-sm flex items-center gap-2">
            {answer ? (
              <>
                {/* Placed answer is draggable now */}
                <DraggableOption
                  variant={answer}
                  text={getTextForVariant(answer)}
                  used={false}
                  origin={String(number)}
                  isInSentenceEnding={false}
                />
              </>
            ) : (
              "—"
            )}
          </div>
        </div>
        <div className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(item) }} />
      </div>
    </div>
  );
}

/* ---------- Sentence Endings Drop Target ---------- */
function SentenceEndingDrop({
  number,
  item,
  answer,
  onDrop,
  onRemove,
  getTextForVariant,
  isSentenceEndings,
}: {
  number: string;
  item: string;
  answer?: string;
  onDrop: (number: string, item: DragItem) => void;
  onRemove: (number: string) => void;
  getTextForVariant: (v?: string) => string;
  isSentenceEndings?: boolean;
}) {
  const [, drop] = useDrop({
    accept: "option",
    drop: (item: DragItem) => onDrop(number, item),
  });

  return (
    <div
      ref={drop as unknown as Ref<HTMLDivElement>}
      className={`flex gap-2 text-sm ${
        answer ? "items-start" : "items-center"
      }`}
    >
      <div className="flex-1 flex flex-wrap items-center gap-2">
        <span dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(item) }} />
        {answer ? (
          <div className="flex items-center gap-2">
            {/* Placed answer is draggable here too */}
            <DraggableOption
              variant={answer}
              text={getTextForVariant(answer)}
              used={false}
              origin={String(number)}
              isInSentenceEnding={isSentenceEndings}
            />
          </div>
        ) : (
          <span className="border p-2 rounded bg-white text-center shadow-sm pointer-events-none select-none min-w-[200px]">
            {number}
          </span>
        )}
      </div>
    </div>
  );
}
