"use client";

import { Input } from "@/components/ui/input";
import { useCurrentExamSection } from "@/hooks/useCurrentExamSection";
import { STORAGE_KEYS } from "@/lib/answerHandlers";
import { highlightCapsText, processTextFormatting } from "@/utils/highlightAsBold";
import { useCallback, useEffect, useRef, useState } from "react";
import { StableHtml } from "@/components/exam/StableHtml";

type TableCell = {
  content: string;
  isInput?: boolean;
  questionNumber?: string;
  questionNumbers?: string[];
  colSpan?: number;
  rowSpan?: number;
  isGray?: boolean;
  textPlacement?:
    | "center"
    | "right-center"
    | "left-center"
    | "bottom-center"
    | "top-center"
    | "top-right"
    | "left-right"
    | "bottom-left"
    | "bottom-right";
  textAlignment?: "left" | "right" | "center";
};

type TableColumn = {
  content: string;
  isInput?: boolean;
  questionNumber?: string;
  questionNumbers?: string[];
  isGray?: boolean;
  textPlacement?:
    | "center"
    | "right-center"
    | "left-center"
    | "bottom-center"
    | "top-center"
    | "top-right"
    | "left-right"
    | "bottom-left"
    | "bottom-right";
  textAlignment?: "left" | "right" | "center";
};

type TableRow = {
  name: string;
  cells: TableCell[];
  isInput?: boolean;
  questionNumber?: string;
  questionNumbers?: string[];
  isGray?: boolean;
  textPlacement?:
    | "center"
    | "right-center"
    | "left-center"
    | "bottom-center"
    | "top-center"
    | "top-right"
    | "left-right"
    | "bottom-left"
    | "bottom-right";
  textAlignment?: "left" | "right" | "center";
};

type TableRowHeader = {
  name: string;
  isInput?: boolean;
  questionNumber?: string;
  questionNumbers?: string[];
  isGray?: boolean;
  textPlacement?:
    | "center"
    | "right-center"
    | "left-center"
    | "bottom-center"
    | "top-center"
    | "top-right"
    | "left-right"
    | "bottom-left"
    | "bottom-right";
  textAlignment?: "left" | "right" | "center";
};

type TableCompletionQuestion = {
  questionStart: string;
  questionEnd: string;
  type: "table-completion";
  instructions: string[];
  headline: string;
  rowHeader?: TableRowHeader;
  cols: TableColumn[]; // Changed from union type
  rows?: TableRow[];
  answerConstraints: string;
};


type Props = {
  question: TableCompletionQuestion;
  onAnswer?: (answers: { number: number; answer: string }[]) => void;
  onAnswerChange?: (answers: { number: number; answer: string }[]) => void;
};

export default function TableCompletionExam({
  question,
  onAnswer,
  onAnswerChange,
}: Props) {
  // Remove noisy render spam
  // console.log('being rendered')

  const currentSection = useCurrentExamSection();

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const storageKey =
      currentSection === "Listening"
        ? STORAGE_KEYS.LISTENING_ANSWERS
        : STORAGE_KEYS.READING_ANSWERS;
    const stored =
      typeof window !== "undefined" ? sessionStorage.getItem(storageKey) : null;
    return stored ? JSON.parse(stored) : {};
  });

  // Use refs to avoid recreating callbacks when these props change
  const onAnswerRef = useRef(onAnswer);
  const onAnswerChangeRef = useRef(onAnswerChange);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
    onAnswerChangeRef.current = onAnswerChange;
  }, [onAnswer, onAnswerChange]);

  // Memoize the conversion function to prevent recreating it on every render
  const toArrayFormat = useCallback(
    (obj: Record<string, string>) =>
      Object.entries(obj).map(([key, value]) => ({
        number: parseInt(key, 10),
        answer: value,
      })),
    []
  );

  // Prevent emitAnswers from causing re-renders by using refs
  const emitAnswers = useCallback(
    (updated: Record<string, string>) => {
      const payload = toArrayFormat(updated);
      onAnswerRef.current?.(payload);
      onAnswerChangeRef.current?.(payload);
    },
    [toArrayFormat]
  );

  const handleAnswerChange = useCallback(
    (questionNumber: number, value: string) => {
      setAnswers((prev) => {
        if (prev[questionNumber] === value) return prev;
        const updated = { ...prev, [questionNumber]: value };

        // Use microtask to avoid blocking render
        setTimeout(() => emitAnswers(updated), 0);

        return updated;
      });
    },
    [emitAnswers]
  );

  // Remove redundant localStorage syncing here. Storage is handled by higher-level handlers.
  // This avoids double writes and global 'answersUpdated' event storms leading to unnecessary re-renders.

  const renderInput = useCallback(
    (text: string, questionNumber: string) => {
      const parts = text.split("____");
      const currentValue = answers[questionNumber] ?? "";

	      return (
	        <span key={`input-wrapper-${questionNumber}`}>
	          {parts.map((part, i) => (
	            <span key={`${questionNumber}-part-${i}-${part.slice(0, 10)}`}>
	              <StableHtml as="span" html={part} />
	              {i < parts.length - 1 && (
	                <Input
                  key={`input-${questionNumber}`}
                  id={`qn-${questionNumber}`}
                  className="inline w-32 mx-1"
                  value={currentValue}
                  onChange={(e) =>
                    handleAnswerChange(+questionNumber, e.target.value)
                  }
                  placeholder={questionNumber}
                />
              )}
            </span>
          ))}
        </span>
      );
    },
    [answers, handleAnswerChange]
  );


  const getPlacementStyles = (
    placement?: string,
    alignment?: string
  ): React.CSSProperties => {
    const styles: React.CSSProperties = {};
  
    // Text placement (using flexbox)
    if (placement) {
      styles.display = 'flex';
      styles.minHeight = '100%';
      
      switch (placement) {
        case 'center':
          styles.justifyContent = 'center';
          styles.alignItems = 'center';
          break;
        case 'top-center':
          styles.justifyContent = 'center';
          styles.alignItems = 'flex-start';
          break;
        case 'bottom-center':
          styles.justifyContent = 'center';
          styles.alignItems = 'flex-end';
          break;
        case 'left-center':
          styles.justifyContent = 'flex-start';
          styles.alignItems = 'center';
          break;
        case 'right-center':
          styles.justifyContent = 'flex-end';
          styles.alignItems = 'center';
          break;
        case 'top-right':
          styles.justifyContent = 'flex-end';
          styles.alignItems = 'flex-start';
          break;
        case 'bottom-left':
          styles.justifyContent = 'flex-start';
          styles.alignItems = 'flex-end';
          break;
        case 'bottom-right':
          styles.justifyContent = 'flex-end';
          styles.alignItems = 'flex-end';
          break;
        case 'left-right':
          styles.justifyContent = 'space-between';
          styles.alignItems = 'center';
          break;
      }
    }
  
    // Text alignment
    if (alignment === 'left') styles.textAlign = 'left';
    else if (alignment === 'right') styles.textAlign = 'right';
    else if (alignment === 'center') styles.textAlign = 'center';
  
    return styles;
  };

  const getContentStyles = (): React.CSSProperties => {
    return {
      whiteSpace: 'pre-line', // Support for line breaks
      wordBreak: 'break-word'
    };
  };

  const renderContentWithQuestions = useCallback(
    (
      content: string,
      isInput?: boolean,
      questionNumber?: string,
      questionNumbers?: string[],
      textPlacement?: string,
      textAlignment?: string
    ) => {
      let processedContent = processTextFormatting(content);
      const wrapperStyles = getPlacementStyles(textPlacement, textAlignment);
  
      if (isInput) {
        if (questionNumbers && questionNumbers.length > 1) {
          let temp = processedContent;
          questionNumbers.forEach((qNum) => {
            if (temp.includes("____")) {
              const parts = temp.split("____");
              temp = parts[0] + `[INPUT_${qNum}]` + parts.slice(1).join("____");
            }
          });
  
          const finalParts = temp.split(/\[INPUT_(\d+)\]/);
          return (
            <div key={`multi-input-${questionNumbers.join("-")}`} style={wrapperStyles}>
              <div style={getContentStyles()}>
                {finalParts.map((part, i) => {
	                  if (i % 2 === 0) {
	                    return (
	                      <StableHtml
	                        key={`text-${i}-${part.slice(0, 10).replace(/\s/g, "")}`}
	                        as="span"
	                        html={part}
	                      />
	                    );
                  } else {
                    const qNum = part;
                    const currentValue = answers[qNum] ?? "";
                    return (
                      <Input
                        key={`multi-input-${qNum}`}
                        id={`qn-${qNum}`}
                        className="inline w-32 mx-1"
                        value={currentValue}
                        onChange={(e) =>
                          handleAnswerChange(+qNum, e.target.value)
                        }
                        placeholder={qNum}
                      />
                    );
                  }
                })}
              </div>
            </div>
          );
        }
  
        const qNum = questionNumber || questionNumbers?.[0] || "";
        if (qNum) {
          const parts = processedContent.split("____");
          const currentValue = answers[qNum] ?? "";
  
          return (
            <div key={`input-wrapper-${qNum}`} style={wrapperStyles}>
              <div style={getContentStyles()}>
	                {parts.map((part, i) => (
	                  <span key={`${qNum}-part-${i}-${part.slice(0, 10)}`}>
	                    <StableHtml as="span" html={part} />
	                    {i < parts.length - 1 && (
	                      <Input
                        key={`input-${qNum}`}
                        id={`qn-${qNum}`}
                        className="inline w-32 mx-1"
                        value={currentValue}
                        onChange={(e) =>
                          handleAnswerChange(+qNum, e.target.value)
                        }
                        placeholder={qNum}
                      />
                    )}
                  </span>
                ))}
              </div>
            </div>
          );
        }
      }
  
	      return (
	        <div style={wrapperStyles}>
	          <StableHtml as="div" style={getContentStyles()} html={processedContent} />
	        </div>
	      );
    },
    [answers, handleAnswerChange]
  );
  const renderCellContent = useCallback(
    (cell: TableCell) => {
      return renderContentWithQuestions(
        cell.content,
        cell.isInput,
        cell.questionNumber,
        cell.questionNumbers,
        cell.textPlacement,
        cell.textAlignment
      );
    },
    [renderContentWithQuestions]
  );

  const renderColumnHeader = useCallback(
    (col: string | TableColumn, index: number) => {
      if (typeof col === "string") {
        return col;
      }
      return renderContentWithQuestions(
        col.content,
        col.isInput,
        col.questionNumber,
        col.questionNumbers,
        col.textPlacement,
        col.textAlignment
      );
    },
    [renderContentWithQuestions]
  );

  const renderRowHeader = useCallback(
    (row: TableRow | TableRowHeader) => {
      if (row.isInput) {
        return renderContentWithQuestions(
          row.name,
          row.isInput,
          row.questionNumber,
          row.questionNumbers,
          row.textPlacement,
          row.textAlignment
        );
      }
      
      const placementStyles = getPlacementStyles(row.textPlacement, row.textAlignment);
      const processedName = processTextFormatting(row.name || "Row");
      
	      return (
	        <div style={placementStyles}>
	          <StableHtml as="div" style={getContentStyles()} html={processedName} />
	        </div>
	      );
    },
    [renderContentWithQuestions]
  );


  const hasRows = question.rows && question.rows.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {question.instructions.map((inst, i) => (
          <p key={i} className="text-gray-700 text-sm">
            {highlightCapsText(inst)}
          </p>
        ))}
      </div>

      <h2 className="text-lg font-semibold">{question.headline}</h2>
      <p className="text-muted-foreground italic">
        {question.answerConstraints}
      </p>
      <div className="overflow-auto border rounded">
        <table className="table-auto border-collapse w-full">
          <thead>
            <tr>
              {hasRows && question.rowHeader && (
                <th style={{background: question.rowHeader.isGray ? "#F9FAFB":"white"}} className="border p-2">
                  {renderRowHeader(question.rowHeader)}
                </th>
              )}
              {question.cols.map((col, i) => (
                <th key={i} style={{background: col.isGray ? "#F9FAFB":"white"}} className="border p-2">
                  {renderColumnHeader(col, i)}
                </th>
              ))}
            </tr>
          </thead>
          {hasRows && (
            <tbody>
              {question.rows!.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <th style={{background: row.isGray ? "#F9FAFB" :"white"}} className="border p-2">
                    {renderRowHeader(row)}
                  </th>
                  {row.cells.map((cell, cellIndex) => (
                    <td
                      style={{background: cell.isGray ? "#F9FAFB":"white"}}
                      key={cellIndex}
                      className="border p-2"
                      colSpan={cell.colSpan || 1}
                      rowSpan={cell.rowSpan || 1}
                    >
                      {renderCellContent(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
