"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuestionNumbersStore } from "@/lib/stores/answeredQuestionsStore";
import { useEffect, useState } from "react";
import { useCurrentExamSection } from "@/hooks/useCurrentExamSection";
import { STORAGE_KEYS } from "@/lib/answerHandlers";
import { processTextWithBoldAndCaps } from "@/utils/highlightAsBold";
import { StableHtml } from "@/components/exam/StableHtml";

type QuestionBlock = {
  type: "form-fill";
  questionStart: string;
  questionEnd: string;
  instructions?: string[];
  answerConstraints?: string;
  headline?: string;
  questions: {
    questionId?: string;
    questionNumber?: string;
    text: string;
    isInteractive: boolean;
  }[];
};

type StaticText = {
  type: "static";
  text: string;
};

type Props = {
  question: QuestionBlock | StaticText;
  value?: Record<string, string>;
  onAnswer?: (answers: { [key: string]: string }[]) => void;
};

export default function FormCompletionExam({
  question,
  value = {},
  onAnswer,
}: Props) {
  const currentSection = useCurrentExamSection();
  const [localAnswers, setLocalAnswers] =
    useState<Record<string, string>>(value);
  const [storedAnswers, setStoredAnswers] = useState<Record<string, string>>(
    {}
  );

  // ✅ Safe hydration of localStorage
  useEffect(() => {
    const key =
      currentSection === "Listening"
        ? STORAGE_KEYS.LISTENING_ANSWERS
        : STORAGE_KEYS.READING_ANSWERS;

    try {
      const raw = sessionStorage.getItem(key);
      setStoredAnswers(JSON.parse(raw || "{}"));
    } catch {
      setStoredAnswers({});
    }
  }, [currentSection]);

  const handleChange = (number: string, val: string) => {
    const updated = { ...localAnswers, [number]: val };
    setLocalAnswers(updated);

    const converted = Object.entries(updated).map(([key, value]) => ({
      number: parseInt(key),
      answer: value,
    }));
    onAnswer?.(converted);
  };

  if (question.type === "static") {
    return <StableHtml as="div" className="text-base mb-3" html={processTextWithBoldAndCaps(question.text)} />;
  }

  return (
    <div className="mb-5">
      <Label className="text-sm mb-1">
        <div className="text-sm text-muted-foreground mb-4">
          Question {question.questionStart}–{question.questionEnd}
        </div>
        <div className="instructions space-y-2">
          {question.instructions?.map((line, idx) => (
            <StableHtml key={idx} as="div" html={processTextWithBoldAndCaps(line)} />
          ))}
        </div>
      </Label>
      {question.headline && (
        <div className="headline mt-6 text-center w-full flex items-center justify-center">
          <StableHtml as="p" className="font-bold" html={processTextWithBoldAndCaps(question.headline)} />
        </div>
      )}
      <div className="mt-6 space-y-3">
        {question.questions.map((q, idx) => {
          const number = q.questionNumber || "";
          const answer = storedAnswers[number] || "";

          return (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-2 text-base"
            >
              {q.isInteractive ? (
                <>
                  <StableHtml as="span" html={processTextWithBoldAndCaps(q.text.split("____")[0])} />
                  <Input
                    id={`qn-${number}`}
                    className="w-40"
                    defaultValue={answer}
                    onChange={(e) => handleChange(number, e.target.value)}
                    placeholder={number}
                  />
                  <StableHtml as="span" html={processTextWithBoldAndCaps(q.text.split("____")[1])} />
                </>
              ) : (
                <StableHtml as="span" html={processTextWithBoldAndCaps(q.text)} />
              )}
            </div>
          );
        })}
      </div>

      {question.answerConstraints && (
        <div className="text-sm text-muted-foreground mt-2 italic">
          {question.answerConstraints}
        </div>
      )}
    </div>
  );
}
