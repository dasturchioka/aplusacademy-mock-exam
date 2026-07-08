"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";

type QuestionBlock = {
  type: "form-fill";
  questionStart: string;
  questionEnd: string;
  instructions?: string[];
	headline?: string;
  answerConstraints?: string;
  isInteractive: true;
  questions: {
    questionId?: string;
    questionNumber?: string;
    text: string;
    isInteractive: boolean;
  }[];
};

type Props = {
  question: QuestionBlock;
  onChange?: (updated: QuestionBlock) => void;
};

export default function FormCompletionAdmin({ question, onChange }: Props) {
  const [localState, setLocalState] = useState<QuestionBlock>(question);
  const isSyncingRef = useRef(false);

  // Sync localState with incoming question prop (for edit mode)
  useEffect(() => {
    isSyncingRef.current = true;
    setLocalState(question);
    // Reset flag after state update completes
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  }, [question]);

  useEffect(() => {
    // Don't call onChange if we're syncing from props to prevent infinite loop
    if (!isSyncingRef.current) {
      onChange?.(localState);
    }
  }, [localState]);

  // 🚀 Auto-renumber interactive questions when questionStart changes
  useEffect(() => {
    const startNum = parseInt(localState.questionStart) || 1;

    const needsRenumbering = localState.questions.some((q, idx) => {
      if (!q.isInteractive) return false;

      // Count interactive questions before this one
      const interactiveCountBefore = localState.questions
        .slice(0, idx)
        .filter((question) => question.isInteractive).length;

      const expectedNumber = (startNum + interactiveCountBefore).toString();
      return q.questionNumber !== expectedNumber;
    });

    if (needsRenumbering) {
      const renumberedQuestions = localState.questions.map((q, idx) => {
        if (!q.isInteractive) return q;

        // Count interactive questions before this one
        const interactiveCountBefore = localState.questions
          .slice(0, idx)
          .filter((question) => question.isInteractive).length;

        return {
          ...q,
          questionNumber: (startNum + interactiveCountBefore).toString(),
        };
      });

      console.log("🔢 Auto-renumbering FormCompletion interactive questions:", {
        questionStart: startNum,
        totalQuestions: renumberedQuestions.length,
        interactiveQuestions: renumberedQuestions.filter((q) => q.isInteractive)
          .length,
        newNumbers: renumberedQuestions
          .filter((q) => q.isInteractive)
          .map((q) => q.questionNumber),
      });

      setLocalState((prev) => ({ ...prev, questions: renumberedQuestions }));
    }
  }, [localState.questionStart]);

  // 🚀 Auto-update questionEnd based on interactive questions
  useEffect(() => {
    const interactiveCount = localState.questions.filter(
      (q) => q.isInteractive
    ).length;

    if (interactiveCount > 0) {
      const startNum = parseInt(localState.questionStart) || 1;
      const expectedEnd = (startNum + interactiveCount - 1).toString();

      if (localState.questionEnd !== expectedEnd) {
        console.log("🔢 Auto-updating questionEnd:", {
          oldEnd: localState.questionEnd,
          newEnd: expectedEnd,
          interactiveQuestions: interactiveCount,
        });

        setLocalState((prev) => ({ ...prev, questionEnd: expectedEnd }));
      }
    }
  }, [localState.questions, localState.questionStart]);

  // 🚀 REAL-TIME COMPONENT LOGGING (Separate useEffect to prevent infinite loops)
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("📝 FormCompletion Component Updated:", {
        type: localState.type,
        questionRange: `${localState.questionStart}-${localState.questionEnd}`,
        questionsCount: localState.questions.length,
        interactiveQuestions: localState.questions.filter(
          (q) => q.isInteractive
        ).length,
        fullStructure: localState,
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, [localState]);

  const updateState = useCallback((patch: Partial<QuestionBlock>) => {
    setLocalState((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateQuestion = useCallback(
    (idx: number, patch: Partial<QuestionBlock["questions"][number]>) => {
      setLocalState((prev) => {
        const updatedQuestions = [...prev.questions];
        const oldQuestion = updatedQuestions[idx];
        updatedQuestions[idx] = { ...updatedQuestions[idx], ...patch };

        // 🚀 REAL-TIME QUESTION UPDATE LOGGING
        if (
          patch.questionId ||
          patch.questionNumber ||
          patch.isInteractive !== undefined
        ) {
          console.log("🔄 Question updated in FormCompletion:", {
            questionIndex: idx,
            changedFields: Object.keys(patch),
            beforeUpdate: oldQuestion,
            afterUpdate: updatedQuestions[idx],
            patch: patch,
          });
        }

        return { ...prev, questions: updatedQuestions };
      });
    },
    []
  );

  const deleteQuestion = useCallback((idx: number) => {
    setLocalState((prev) => {
      const removedQuestion = prev.questions[idx];
      const updatedQuestions = prev.questions.filter((_, i) => i !== idx);

      // 🚀 REAL-TIME QUESTION REMOVAL LOGGING
      console.log("❌ Removed text block from FormCompletion:", {
        removedIndex: idx,
        removedQuestion: removedQuestion,
        wasInteractive: removedQuestion.isInteractive,
        remainingBlocks: updatedQuestions.length,
        interactiveBlocks: updatedQuestions.filter((q) => q.isInteractive)
          .length,
      });

      return { ...prev, questions: updatedQuestions };
    });
  }, []);

  const addTextBlock = useCallback(() => {
    setLocalState((prev) => {
      const newQ = { text: "", isInteractive: false };
      const updatedQuestions = [...prev.questions, newQ];

      // 🚀 REAL-TIME QUESTION ADDITION LOGGING
      console.log("➕ Added text block to FormCompletion:", {
        newBlockIndex: prev.questions.length,
        totalBlocks: updatedQuestions.length,
        interactiveBlocks: updatedQuestions.filter((q) => q.isInteractive)
          .length,
        addedBlock: newQ,
      });

      return { ...prev, questions: updatedQuestions };
    });
  }, []);

  const updateInstruction = useCallback((idx: number, value: string) => {
    setLocalState((prev) => {
      const updatedInstructions = [...(prev.instructions || [])];
      updatedInstructions[idx] = value;
      return { ...prev, instructions: updatedInstructions };
    });
  }, []);

  const removeInstruction = useCallback((idx: number) => {
    setLocalState((prev) => {
      const updatedInstructions = [...(prev.instructions || [])];
      updatedInstructions.splice(idx, 1);
      return { ...prev, instructions: updatedInstructions };
    });
  }, []);

  const addInstruction = useCallback(() => {
    setLocalState((prev) => {
      const updatedInstructions = [...(prev.instructions || []), ""];
      return { ...prev, instructions: updatedInstructions };
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div>
          <Label className="text-sm">Start #</Label>
          <Input
            value={localState.questionStart}
            onChange={(e) => updateState({ questionStart: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-sm">End #</Label>
          <Input
            value={localState.questionEnd}
            onChange={(e) => updateState({ questionEnd: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Instructions</Label>
        <div className="space-y-2 mt-2">
          {(localState.instructions || []).map((instr, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                value={instr}
                onChange={(e) => updateInstruction(idx, e.target.value)}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-red-500"
                onClick={() => removeInstruction(idx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addInstruction}>
            + Add Instruction
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-sm">Answer Constraints</Label>
        <Input
          value={localState.answerConstraints || ""}
          onChange={(e) => updateState({ answerConstraints: e.target.value })}
        />
      </div>

      <div>
        <Label className="text-sm">Headline</Label>
        <Input
          value={localState.headline || ""}
          onChange={(e) => updateState({ headline: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold">Questions</Label>
        {localState.questions.map((q, idx) => (
          <div
            key={idx}
            className="border p-4 rounded-md space-y-3 relative bg-muted/10"
          >
            <div className="flex items-center gap-4">
              <Label className="text-sm">Interactive</Label>
              <Switch
                checked={q.isInteractive}
                onCheckedChange={(checked) => {
                  const updates: any = {
                    isInteractive: checked,
                  };

                  if (checked) {
                    // Get the starting question number
                    const startNum = parseInt(localState.questionStart) || 1;

                    // Count only interactive questions up to this index
                    const interactiveCountBefore = localState.questions
                      .slice(0, idx)
                      .filter((question) => question.isInteractive).length;

                    // Calculate question number based on questionStart + interactive count
                    const newQuestionNumber = (
                      startNum + interactiveCountBefore
                    ).toString();

                    // Generate questionId and questionNumber when toggled to interactive
                    updates.questionId = `${Math.random()
                      .toString(36)
                      .substr(2, 9)}-${Date.now()}`;
                    updates.questionNumber = newQuestionNumber;
                  } else {
                    // Remove questionId and questionNumber when toggled to non-interactive
                    updates.questionId = undefined;
                    updates.questionNumber = undefined;
                    updates.number = undefined;
                  }

                  // 🚀 REAL-TIME INTERACTIVE TOGGLE LOGGING
                  console.log("🔄 Interactive toggle changed:", {
                    questionIndex: idx,
                    newState: checked,
                    questionId: updates.questionId,
                    questionNumber: updates.questionNumber,
                    beforeUpdate: q,
                    afterUpdate: { ...q, ...updates },
                  });

                  updateQuestion(idx, updates);
                }}
              />
            </div>

            {q.isInteractive && (
              <>
                <div>
                  <Label className="text-sm">Question ID</Label>
                  <Input
                    value={q.questionId || ""}
                    onChange={(e) =>
                      updateQuestion(idx, { questionId: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm">Question Number</Label>
                  <Input
                    value={q.questionNumber || ""}
                    onChange={(e) =>
                      updateQuestion(idx, { questionNumber: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div>
              <Label className="text-sm">Text</Label>
              <Textarea
                value={q.text}
                onChange={(e) => updateQuestion(idx, { text: e.target.value })}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-red-500"
              onClick={() => deleteQuestion(idx)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addTextBlock}>
        + Add Text Block
      </Button>
    </div>
  );
}
