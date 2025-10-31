import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentExamSection } from "@/hooks/useCurrentExamSection";
import { STORAGE_KEYS } from "@/lib/answerHandlers";
import { processTextWithBoldAndCaps } from "@/utils/highlightAsBold";
import { ArrowDown, GripVertical, Trash2 } from "lucide-react";
import React, { Fragment, useEffect, useRef, useState } from "react";

export type FlowChartNode = {
  id: string;
  text: string;
  isInteractive: boolean;
  // single-question mode:
  questionNumber?: number;
  // multiple-question mode:
  isMultiple?: boolean;
  questionStart?: number;
  questionEnd?: number;
  position: "bottom";
  interactionType?: "input" | "matching";
};

export type FlowChartQuestionBlock = {
  type: "flow-chart";
  instructions: string[];
  headline?: string;
  questionStart: number;
  questionEnd: number;
  nodes: FlowChartNode[];
  matchingOptions?: { label: string; text: string }[];
  optionsAtATime?: number;
  optionsHeadline?: string;
};

type FlowChartExamProps = {
  question: {
    instructions: string[];
    headline?: string;
    nodes: FlowChartNode[];
    questionStart: number;
    questionEnd: number;
    matchingOptions?: { label: string; text: string }[];
    optionsAtATime?: number;
    answerConstraints?: string;
		optionsHeadline?:string
  };
  onAnswer: (answers: { number: number; answer: string }[]) => void;
};

export function FlowChartExam({ question, onAnswer }: FlowChartExamProps) {
  const currentSection = useCurrentExamSection();
  const [answers, setAnswers] = useState<{ number: number; answer: string }[]>(
    []
  );
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});

  // Stabilize onAnswer to avoid changing closures
  const onAnswerRef = useRef(onAnswer);
  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  const allOptions = question.matchingOptions || [];
  const maxUses = question.optionsAtATime || 1;

  // Helper: produce all interactive question numbers from nodes
  const collectInteractiveQuestionNumbers = () => {
    const nums: number[] = [];
    question.nodes.forEach((node) => {
      if (!node.isInteractive) return;
      if (
        node.isMultiple &&
        node.questionStart != null &&
        node.questionEnd != null
      ) {
        for (let n = node.questionStart; n <= node.questionEnd; n++)
          nums.push(n);
      } else if (node.questionNumber != null) {
        nums.push(node.questionNumber);
      }
    });
    return nums;
  };

  // Initialize answers and usage counts from localStorage / question
  useEffect(() => {
    const key =
      currentSection === "Listening"
        ? STORAGE_KEYS.LISTENING_ANSWERS
        : STORAGE_KEYS.READING_ANSWERS;
    const stored = sessionStorage.getItem(key);
    const parsed: Record<string, string> = stored ? JSON.parse(stored) : {};

    // Build initial answers mapped to all interactive q numbers
    const interactiveNums = collectInteractiveQuestionNumbers();
    const initialAnswers = interactiveNums.map((n) => ({
      number: n,
      answer: parsed[n] || "",
    }));

    setAnswers(initialAnswers);

    // compute usage counts based on initial answers
    const counts: Record<string, number> = {};
    allOptions.forEach((opt) => {
      counts[opt.label] = initialAnswers.filter(
        (a) => a.answer === opt.label
      ).length;
    });
    setUsageCounts(counts);

    // Notify parent after commit
    queueMicrotask(() => onAnswerRef.current?.(initialAnswers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, currentSection]);

  // Persist helper (writes single qn -> label to localStorage)
  const persistAnswerToStorage = (qn: number, label: string) => {
    try {
      const key =
        currentSection === "Listening"
          ? STORAGE_KEYS.LISTENING_ANSWERS
          : STORAGE_KEYS.READING_ANSWERS;
      const existing = sessionStorage.getItem(key);
      const parsed: Record<string, string> = existing
        ? JSON.parse(existing)
        : {};
      if (label) parsed[qn] = label;
      else delete parsed[qn];
      sessionStorage.setItem(key, JSON.stringify(parsed));
    } catch {}
  };

  // Update an answer for a single question number and adjust counts and persistence
  const updateAnswer = (qn: number, label: string) => {
    setAnswers((prevAnswers) => {
      // ensure qn exists in answers (in case nodes changed)
      const exists = prevAnswers.some((a) => a.number === qn);
      const prev = exists
        ? prevAnswers
        : [...prevAnswers, { number: qn, answer: "" }];

      const oldAnswer = prev.find((a) => a.number === qn)?.answer || "";
      const newAnswers = prev.map((a) =>
        a.number === qn ? { number: qn, answer: label } : a
      );

      // update usage counts
      setUsageCounts((prevCounts) => {
        const next = { ...prevCounts };
        if (oldAnswer)
          next[oldAnswer] = Math.max(0, (next[oldAnswer] || 0) - 1);
        if (label) next[label] = (next[label] || 0) + 1;
        return next;
      });

      // persist locally (no global events)
      persistAnswerToStorage(qn, label);

      return newAnswers;
    });
  };

  // Notify parent when answers change (after commit)
  useEffect(() => {
    if (!answers) return;
    onAnswerRef.current?.(answers);
  }, [answers]);

  // robust drag start handler for an option (from available list)
  const handleOptionDragStart = (
    e: React.DragEvent,
    option: { label: string; text: string }
  ) => {
    // set multiple data types for reliability
    try {
      e.dataTransfer.setData("application/json", JSON.stringify(option));
    } catch {}
    try {
      e.dataTransfer.setData("text/plain", option.label);
    } catch {}
    e.dataTransfer.effectAllowed = "copyMove";

    // create a small drag image for better cross-browser UX
    const dragNode = document.createElement("div");
    dragNode.style.position = "absolute";
    dragNode.style.top = "-9999px";
    dragNode.style.left = "-9999px";
    dragNode.style.padding = "6px 10px";
    dragNode.style.background = "white";
    dragNode.style.border = "1px solid rgba(0,0,0,0.12)";
    dragNode.style.borderRadius = "3px";
    dragNode.style.fontSize = "12px";
    dragNode.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
    dragNode.innerText = `${option.label} — ${option.text}`;
    document.body.appendChild(dragNode);
    (e.currentTarget as any).__dragImage = dragNode;
    try {
      e.dataTransfer.setDragImage(dragNode, 10, 10);
    } catch {}
  };

  // drag end cleanup (removes drag image node if created)
  const handleOptionDragEnd = (e: React.DragEvent) => {
    const dragNode = (e.currentTarget as any).__dragImage as
      | HTMLElement
      | undefined;
    if (dragNode && dragNode.parentNode) {
      dragNode.parentNode.removeChild(dragNode);
      (e.currentTarget as any).__dragImage = undefined;
    }
  };

  // drag start for a placed option inside a drop zone (value)
  const handlePlacedDragStart = (e: React.DragEvent, label: string) => {
    const opt = allOptions.find((o) => o.label === label);
    if (!opt) {
      try {
        e.dataTransfer.setData("text/plain", label);
      } catch {}
      e.dataTransfer.effectAllowed = "move";
      return;
    }
    handleOptionDragStart(e, opt);
  };

  // ensure drop zones accept drops
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // onDrop handler for a specific target question number (supports swaps)
  const handleDrop = (e: React.DragEvent, targetQn: number) => {
    e.preventDefault();

    // read option from dataTransfer (JSON preferred, fallback to plain label)
    let opt: { label: string; text: string } | null = null;
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw) opt = JSON.parse(raw);
    } catch {}
    if (!opt) {
      try {
        const label = e.dataTransfer.getData("text/plain");
        if (label) {
          const found = allOptions.find((o) => o.label === label);
          opt = found || { label, text: "" };
        }
      } catch {}
    }
    if (!opt) return;

    // detect if this option is currently placed somewhere else
    const sourceQn = answers.find((a) => a.answer === opt!.label)?.number;
    const targetCurrentAnswer =
      answers.find((a) => a.number === targetQn)?.answer || "";

    // usage check: if placing new label would exceed max uses (exclude swap case where sourceQn === found)
    const usedCount = usageCounts[opt.label] || 0;
    const effectiveUsed = sourceQn === targetQn ? usedCount : usedCount; // handled below
    // If sourceQn exists and is different from targetQn, swapping won't change total usage,
    // so we only need to check the case where option comes from available list (no sourceQn).
    if (!sourceQn) {
      if (usedCount >= maxUses) return; // cannot place
    }

    // If sourceQn exists and different from targetQn => swap
    if (sourceQn && sourceQn !== targetQn) {
      // swap answers
      const sourceAnswer =
        answers.find((a) => a.number === sourceQn)?.answer || "";
      const targetAnswer =
        answers.find((a) => a.number === targetQn)?.answer || "";

      // Perform swap via updateAnswer (which handles counts/persistence)
      updateAnswer(sourceQn, targetAnswer);
      updateAnswer(
        targetQn,
        sourceAnswer === opt.label ? opt.label : opt.label
      );
      // Effectively target gets opt.label, source gets previous targetAnswer
      // (updateAnswer handles counts)
    } else {
      // normal placement / replacement
      // If target already has same label, do nothing
      if (targetCurrentAnswer === opt.label) return;

      // If placing from list (no source) ensure not exceed max uses
      if (!sourceQn && (usageCounts[opt.label] || 0) >= maxUses) return;

      updateAnswer(targetQn, opt.label);
    }
  };

  // whether there exist any interactive matching nodes
  const hasMatchingNodes = question.nodes.some(
    (n) => n.isInteractive && n.interactionType === "matching"
  );

  // options still available (filter out fully-used ones). Partially-used remain but will be shown with line-through.
  const availableOptions = allOptions.filter(
    (opt) => (usageCounts[opt.label] || 0) < maxUses
  );

  // Utility: render text with placeholders; for multi nodes, compute qn for each placeholder
  const renderNodeContent = (node: FlowChartNode) => {
    const interactionType = node.interactionType || "input";
    const textParts = node.text ? node.text.split(/_{4}/) : [node.text || ""];

    // for multi nodes: starting qn
    const startQn =
      node.isMultiple && node.questionStart != null
        ? node.questionStart
        : node.questionNumber;

    return textParts.map((part, idx) => {
      // For each placeholder occurrence, compute qn
      const isLastPart = idx === textParts.length - 1;
      const placeholder = !isLastPart
        ? (() => {
            const qn = startQn != null ? startQn + idx : undefined;
            if (interactionType === "input") {
              const value = qn
                ? answers.find((a) => a.number === qn)?.answer || ""
                : "";
              return (
                <Input
                  id={`qn-${qn}`}
                  placeholder={String(qn) ?? ""}
                  value={value}
                  onChange={(e) => qn && updateAnswer(qn, e.target.value)}
                  className="inline-block w-40"
                />
              );
            }

            // matching drop zone
            const value = qn
              ? answers.find((a) => a.number === qn)?.answer || ""
              : "";
            return (
              <div
                key={`dz-${node.id}-${idx}`}
                draggable={!!value}
                id={`qn-${qn}`}
                onDragStart={(e) => {
                  if (value) handlePlacedDragStart(e, value);
                }}
                onDragEnd={handleOptionDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => qn && handleDrop(e, qn)}
                className={`inline-block min-h-[36px] min-w-[120px] px-2 py-1 border-2 border-dashed rounded text-center align-middle ${
                  value ? "bg-blue-50 border-blue-400" : "border-gray-300"
                }`}
              >
                {value ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-medium text-blue-700">
                      {(() => {
                        const found = allOptions.find((o) => o.label === value);
                        return found ? `${found.label}. ${found.text}` : value;
                      })()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => qn && updateAnswer(qn, "")}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-gray-500">{qn ?? ""}</span>
                )}
              </div>
            );
          })()
        : null;

      return (
        <Fragment key={`${node.id}-${idx}`}>
          <span dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(part) }} />
          {placeholder}
        </Fragment>
      );
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-700 italic">
        Questions {question.questionStart}-{question.questionEnd}
      </p>

      {question.instructions.map((inst, i) => (
        <p key={i} className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(inst) }} />
      ))}

      {/* Headline */}
      {question.headline && (
        <div className="text-center w-full flex items-center justify-center">
          <p className="font-bold" dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(question.headline) }} />
        </div>
      )}

      {/* Main content: Flowchart on left, Options on right */}
      <div className="flex gap-6 items-start">
        {/* Flow chart nodes: supports single and multiple placeholders */}
        <div className="flex-1 space-y-4 min-w-0">
          {question.nodes.map((node, index) => {
            const isLastNode = !!question.nodes[index + 1];
            // We render node text, and inline placeholders are built by renderNodeContent
            return (
              <React.Fragment key={node.id}>
                <div className="border p-4 rounded-xl">
                  {node.isInteractive ? (
                    <div className="text-sm mb-2">{renderNodeContent(node)}</div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(node.text) }} />
                  )}
                </div>
                {isLastNode && <ArrowDown className="ml-20" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Options Panel - Always visible on the right */}
        {hasMatchingNodes &&
          (availableOptions.length > 0 || allOptions.length > 0) && (
            <div className="w-80 shrink-0">
              <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white shadow-lg">
                <div className="p-4">
                  <div className="mb-3">
                    {question.optionsHeadline && (
                      <p className="text-sm text-gray-600 mb-2" dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(question.optionsHeadline) }} />
                    )}
                    <Label className="text-md font-semibold block">
                      Available Options:
                    </Label>
                  </div>
                  <div className="space-y-2">
                    {allOptions.map((option, idx) => {
                      const used = usageCounts[option.label] || 0;
                      const isFullyUsed = used >= maxUses;
                      const isPartiallyUsed = !isFullyUsed && used > 0;
                      if (isFullyUsed) return null;
                      return (
                        <div
                          key={idx}
                          draggable
                          onDragStart={(e) => handleOptionDragStart(e, option)}
                          onDragEnd={handleOptionDragEnd}
                          className={`px-3 py-2 bg-blue-50 border border-blue-300 rounded cursor-grab flex items-center gap-2 text-sm hover:bg-blue-100 active:cursor-grabbing select-none transition-all`}
                        >
                          <GripVertical className="w-3 h-3 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <span
                              className={`${
                                isPartiallyUsed ? "line-through text-gray-400" : ""
                              } font-medium block`}
                              dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(option.label) }}
                            />
                            <span
                              className={`${
                                isPartiallyUsed ? "line-through text-gray-300" : "text-gray-600"
                              } text-xs block`}
                              dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(option.text) }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
      {question.answerConstraints && (
        <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(question.answerConstraints) }} />
      )}
    </div>
  );
}
