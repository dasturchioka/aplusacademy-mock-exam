"use client";

import { YNNGBlock } from "@/components/admin/reading/YesNoNotGiven";
import { useQuestionNumbersStore } from "@/lib/stores/answeredQuestionsStore";
import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/answerHandlers";
import { useCurrentExamSection } from "@/hooks/useCurrentExamSection";
import { processTextWithBoldAndCaps } from "@/utils/highlightAsBold";

export default function YesNoNotGivenExam({
  question,
  onAnswerChange,
}: {
  question: YNNGBlock;
  onAnswerChange: (answers: Array<{ number: number; answer: string }>) => void;
}) {
  const pushNumber = useQuestionNumbersStore((state) => state.pushNumber);
  const currentSection = useCurrentExamSection();

  const [answers, setAnswers] = useState<
    Array<{ number: number; answer: string }>
  >([]);

  const handleChange = (questionNumber: number, value: string) => {
    const updated = [
      ...answers.filter((ans) => ans.number !== questionNumber),
      { number: questionNumber, answer: value },
    ];
    setAnswers(updated);
    onAnswerChange(updated);
  };

  useEffect(() => {
    const start = +question.questionStart;
    const end = +question.questionEnd;
    const range = (start: number, end: number): number[] =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const numbers = range(start, end);

    // Register question numbers to store
    for (let i = 0; i < numbers.length; i++) {
      pushNumber(numbers[i]);
    }

    // Load answers from localStorage
    let storageKey = "";
    if (currentSection === "Reading") {
      storageKey = STORAGE_KEYS.READING_ANSWERS;
    } else if (currentSection === "Listening") {
      storageKey = STORAGE_KEYS.LISTENING_ANSWERS;
    }

    if (storageKey) {
      const raw = sessionStorage.getItem(storageKey) || "{}";
      const parsed = JSON.parse(raw) as Record<string, string>;

      const loadedAnswers = Object.entries(parsed)
        .map(([key, value]) => ({
          number: parseInt(key),
          answer: value,
        }))
        .filter((ans) => ans.number >= start && ans.number <= end);

      if (loadedAnswers.length > 0) {
        setAnswers(loadedAnswers);
        onAnswerChange(loadedAnswers);
      }
    }
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-gray-700 italic">
        Questions {question.questionStart}-{question.questionEnd}
      </p>
      {question.instructions.map((inst, i) => (
        <p
          dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(inst) }}
          key={i}
          className="text-sm italic text-gray-700"
        ></p>
      ))}

      {/* Headline */}
      {question.headline && (
        <div className="text-center w-full flex items-center justify-center my-4">
          <p className="font-bold">{question.headline}</p>
        </div>
      )}

      {question.questions.map((q, idx) => (
        <div
          id={`qn-${q.questionNumber}`}
          key={q.questionId}
          className="space-y-2"
        >
          <p className="font-medium">
            {Number(question.questionStart) + idx}. {q.questionText}
          </p>

          <div className="space-y-1 pl-4">
            {q.options.map((opt) => (
              <label
                key={opt.text}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`q-${q.questionId}`}
                  value={opt.text}
                  checked={
                    answers.find((a) => a.number === Number(q.questionNumber))
                      ?.answer === opt.text
                  }
                  disabled={!opt.isInteractive}
                  onChange={() =>
                    handleChange(Number(q.questionNumber), opt.text)
                  }
                />
                {opt.text}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
