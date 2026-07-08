"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";

// Types based on all-tests.json structure
interface CorrectAnswer {
  number: number | number[];
  accepted: string[] | string[][];
  type?: "multi-select-pair";
}

interface SectionAnswers {
  section: string;
  answers: CorrectAnswer[];
}

interface CorrectAnswersData {
  correct_answers: SectionAnswers[];
}

interface TestData {
  listening: {
    parts: Array<{
      questionBlocks: Array<{
        questionStart: number | string;
        questionEnd: number | string;
        type: string;
      }>;
    }>;
  };
  reading: {
    passages: Array<{
      questionBlocks: Array<{
        questionStart: number | string;
        questionEnd: number | string;
        type: string;
      }>;
    }>;
  };
}

interface Props {
  testData: TestData;
  correctAnswers: CorrectAnswersData;
  onChange: (updated: CorrectAnswersData) => void;
}

export default function CorrectAnswersManager({
  testData,
  correctAnswers,
  onChange,
}: Props) {
  const [localAnswers, setLocalAnswers] =
    useState<CorrectAnswersData>(correctAnswers);

  // Debounce onChange to prevent excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localAnswers);
    }, 100);

    return () => clearTimeout(timer);
  }, [localAnswers, onChange]);

  // 🚀 REAL-TIME CORRECT ANSWERS LOGGING (Separate useEffect to prevent infinite loops)
  useEffect(() => {
    if (localAnswers.correct_answers.length > 0) {
      const timeout = setTimeout(() => {
        console.log("✅ CorrectAnswersManager Updated:", {
          totalSections: localAnswers.correct_answers.length,
          totalAnswers: localAnswers.correct_answers.reduce(
            (total, section) => total + section.answers.length,
            0
          ),
          sectionsBreakdown: localAnswers.correct_answers.map((section) => ({
            section: section.section,
            answersCount: section.answers.length,
            multiSelectPairs: section.answers.filter(
              (a) => a.type === "multi-select-pair"
            ).length,
          })),
          fullStructure: localAnswers,
        });
      }, 0);

      return () => clearTimeout(timeout);
    }
  }, [localAnswers]);

  // Extract all question numbers from test structure
  const getAllQuestionNumbers = (
    section: "Listening" | "Reading"
  ): number[] => {
    const questionNumbers: number[] = [];

    if (section === "Listening") {
      testData.listening.parts.forEach((part) => {
        part.questionBlocks.forEach((block) => {
          const start =
            typeof block.questionStart === "string"
              ? parseInt(block.questionStart)
              : block.questionStart;
          const end =
            typeof block.questionEnd === "string"
              ? parseInt(block.questionEnd)
              : block.questionEnd;

          for (let i = start; i <= end; i++) {
            questionNumbers.push(i);
          }
        });
      });
    } else {
      testData.reading.passages.forEach((passage) => {
        passage.questionBlocks.forEach((block) => {
          const start =
            typeof block.questionStart === "string"
              ? parseInt(block.questionStart)
              : block.questionStart;
          const end =
            typeof block.questionEnd === "string"
              ? parseInt(block.questionEnd)
              : block.questionEnd;

          for (let i = start; i <= end; i++) {
            questionNumbers.push(i);
          }
        });
      });
    }

    return questionNumbers.sort((a, b) => a - b);
  };

  // Get or create section answers
  const getSectionAnswers = (section: string): SectionAnswers => {
    const existing = localAnswers.correct_answers.find(
      (s) => s.section === section
    );
    if (existing) return existing;

    const newSection: SectionAnswers = { section, answers: [] };
    return newSection;
  };

  // Update section answers
  const updateSectionAnswers = useCallback(
    (section: string, answers: CorrectAnswer[]) => {
      setLocalAnswers((prev) => {
        const updated = { ...prev };
        const sectionIndex = updated.correct_answers.findIndex(
          (s) => s.section === section
        );

        if (sectionIndex >= 0) {
          updated.correct_answers[sectionIndex].answers = answers;
        } else {
          updated.correct_answers.push({ section, answers });
        }

        return updated;
      });
    },
    []
  );

  // Add answer for a question number with smart positioning
  const addAnswer = useCallback((section: string, questionNumber: number) => {
    setLocalAnswers((prev) => {
      const sectionAnswers = prev.correct_answers.find(
        (s) => s.section === section
      );
      const currentAnswers = sectionAnswers ? sectionAnswers.answers : [];

      const newAnswer: CorrectAnswer = {
        number: questionNumber,
        accepted: [""],
      };

      let updatedAnswers = [...currentAnswers, newAnswer].sort((a, b) => {
        const aNum = Array.isArray(a.number) ? a.number[0] : a.number;
        const bNum = Array.isArray(b.number) ? b.number[0] : b.number;
        return aNum - bNum;
      });

      // Find the index where the new answer was inserted
      const insertedIndex = updatedAnswers.findIndex((a) => {
        const num = Array.isArray(a.number) ? a.number[0] : a.number;
        return num === questionNumber;
      });

      // If inserted in the middle, renumber subsequent answers
      if (insertedIndex >= 0 && insertedIndex < updatedAnswers.length - 1) {
        console.log("🔢 Added answer in the middle, renumbering subsequent:", {
          section,
          insertedAt: insertedIndex,
          questionNumber,
        });
        updatedAnswers = renumberSubsequentAnswers(
          updatedAnswers,
          insertedIndex
        );
      }

      // Create updated state
      const updated = { ...prev };
      const sectionIndex = updated.correct_answers.findIndex(
        (s) => s.section === section
      );

      if (sectionIndex >= 0) {
        updated.correct_answers[sectionIndex].answers = updatedAnswers;
      } else {
        updated.correct_answers.push({ section, answers: updatedAnswers });
      }

      return updated;
    });
  }, []);

  // Remove answer with smart renumbering
  const removeAnswer = useCallback((section: string, answerIndex: number) => {
    setLocalAnswers((prev) => {
      const sectionAnswers = prev.correct_answers.find(
        (s) => s.section === section
      );
      if (!sectionAnswers) return prev;

      let updatedAnswers = [...sectionAnswers.answers];

      console.log("🔢 Removing answer and renumbering subsequent answers:", {
        section,
        answerIndex,
        removedQuestion: updatedAnswers[answerIndex].number,
      });

      // Remove the answer
      updatedAnswers.splice(answerIndex, 1);

      // Renumber all subsequent answers if there are any
      if (answerIndex < updatedAnswers.length && answerIndex > 0) {
        updatedAnswers = renumberSubsequentAnswers(
          updatedAnswers,
          answerIndex - 1
        );
      }

      // Create updated state
      const updated = { ...prev };
      const sectionIndex = updated.correct_answers.findIndex(
        (s) => s.section === section
      );
      if (sectionIndex >= 0) {
        updated.correct_answers[sectionIndex].answers = updatedAnswers;
      }

      return updated;
    });
  }, []);

  // 🚀 Smart renumbering: Adjust all subsequent question numbers after a change
  const renumberSubsequentAnswers = (
    answers: CorrectAnswer[],
    fromIndex: number
  ): CorrectAnswer[] => {
    const result = [...answers];

    // Calculate the expected next number based on ALL previous answers
    let expectedNext = 1;

    // Go through all answers BEFORE the one we're renumbering from
    for (let i = 0; i <= fromIndex; i++) {
      const answer = result[i];
      const numbers = Array.isArray(answer.number)
        ? answer.number
        : [answer.number];
      const maxNumber = Math.max(...numbers);
      expectedNext = maxNumber + 1;
    }

    // Now renumber all subsequent answers starting from fromIndex + 1
    for (let i = fromIndex + 1; i < result.length; i++) {
      const answer = result[i];
      const currentNumbers = Array.isArray(answer.number)
        ? answer.number
        : [answer.number];
      const count = currentNumbers.length;

      if (count === 1) {
        // Single question number
        result[i] = { ...answer, number: expectedNext };
        expectedNext++;
      } else {
        // Multiple question numbers (for multi-select-pair)
        const newNumbers = Array.from(
          { length: count },
          (_, idx) => expectedNext + idx
        );
        result[i] = { ...answer, number: newNumbers };
        expectedNext += count;
      }
    }

    return result;
  };

  // Generate all permutations of an array
  const generatePermutations = <T,>(arr: T[]): T[][] => {
    if (arr.length <= 1) return [arr];

    const result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const remainingPermutations = generatePermutations(remaining);

      for (const perm of remainingPermutations) {
        result.push([current, ...perm]);
      }
    }

    return result;
  };

  // Update answer details with smart renumbering - optimized to reduce lag
  const updateAnswer = useCallback(
    (section: string, answerIndex: number, updates: Partial<CorrectAnswer>) => {
      setLocalAnswers((prev) => {
        const sectionAnswers = prev.correct_answers.find(
          (s) => s.section === section
        );
        if (!sectionAnswers) return prev;

        let updatedAnswers = [...sectionAnswers.answers];

        // Check if number change affects subsequent numbering
        const oldAnswer = updatedAnswers[answerIndex];
        const oldNumbers = Array.isArray(oldAnswer.number)
          ? oldAnswer.number
          : [oldAnswer.number];
        const oldCount = oldNumbers.length;

        // Apply the update
        updatedAnswers[answerIndex] = { ...oldAnswer, ...updates };

        // Check new count and numbers
        const newAnswer = updatedAnswers[answerIndex];
        const newNumbers = Array.isArray(newAnswer.number)
          ? newAnswer.number
          : [newAnswer.number];
        const newCount = newNumbers.length;

        // Check if the numbers themselves changed (not just added/removed)
        const numbersChanged =
          updates.number !== undefined &&
          (oldCount !== newCount ||
            !oldNumbers.every((num, idx) => num === newNumbers[idx]));

        // Trigger renumbering if:
        // 1. Count of questions changed
        // 2. Type changed (normal <-> multi-select-pair)
        // 3. Question numbers were manually edited
        const shouldRenumber =
          oldCount !== newCount ||
          (updates.type !== undefined && oldAnswer.type !== updates.type) ||
          numbersChanged;

        if (shouldRenumber) {
          console.log("🔢 Smart renumbering triggered:", {
            answerIndex,
            oldCount,
            newCount,
            typeChange: oldAnswer.type !== updates.type,
            numbersChanged,
            section,
          });
          updatedAnswers = renumberSubsequentAnswers(
            updatedAnswers,
            answerIndex
          );
        }
        // Create updated state
        const updated = { ...prev };
        const sectionIndex = updated.correct_answers.findIndex(
          (s) => s.section === section
        );
        if (sectionIndex >= 0) {
          updated.correct_answers[sectionIndex].answers = updatedAnswers;
        }

        return updated;
      });
    },
    []
  );

  // Auto-populate answers - always create 40 answers for listening and reading
  const autoPopulateAnswers = useCallback(
    (section: string) => {
      const answers: CorrectAnswer[] = Array.from({ length: 40 }, (_, i) => ({
        number: i + 1,
        accepted: [""],
      }));
      updateSectionAnswers(section, answers);
    },
    [updateSectionAnswers]
  );

  const sections = ["Listening", "Reading"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correct Answers Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((section) => {
          const sectionAnswers = getSectionAnswers(section);

          return (
            <Card key={section} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {section} Section
                    <Badge variant="outline" className="ml-2">
                      {sectionAnswers.answers.length} / 40 answers
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => autoPopulateAnswers(section)}
                  >
                    Auto-populate All (40)
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sectionAnswers.answers.map((answer, answerIndex) => {
                  // Create a stable unique key using section and question number(s)
                  const questionKey = Array.isArray(answer.number)
                    ? `${section}-${answer.number.join("-")}`
                    : `${section}-${answer.number}`;

                  return (
                    <Card
                      key={`${questionKey}-${answerIndex}`}
                      className="p-4 border"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">
                            Question{" "}
                            {Array.isArray(answer.number)
                              ? answer.number.join(", ")
                              : answer.number}
                            {answer.type && (
                              <Badge className="ml-2">{answer.type}</Badge>
                            )}
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAnswer(section, answerIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Question Number(s) */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Question Number(s)</Label>
                            {Array.isArray(answer.number) ? (
                              <div className="space-y-1">
                                {answer.number.map((num, numIndex) => (
                                  <div
                                    key={`${section}-qnum-${answerIndex}-${numIndex}-${num}`}
                                    className="flex gap-1"
                                  >
                                    <Input
                                      type="number"
                                      value={num}
                                      onChange={(e) => {
                                        const newNumbers = [
                                          ...(answer.number as number[]),
                                        ];
                                        newNumbers[numIndex] = parseInt(
                                          e.target.value
                                        );
                                        updateAnswer(section, answerIndex, {
                                          number: newNumbers,
                                        });
                                      }}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const currentNumbers =
                                          answer.number as number[];
                                        const newNumbers =
                                          currentNumbers.filter(
                                            (_, i) => i !== numIndex
                                          );

                                        // If only 1 number left, convert back to normal type
                                        if (newNumbers.length === 1) {
                                          updateAnswer(section, answerIndex, {
                                            number: newNumbers[0],
                                            type: undefined,
                                          });
                                        } else {
                                          updateAnswer(section, answerIndex, {
                                            number: newNumbers,
                                          });
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentNumbers =
                                      answer.number as number[];
                                    const nextNumber =
                                      Math.max(...currentNumbers) + 1;
                                    const newNumbers = [
                                      ...currentNumbers,
                                      nextNumber,
                                    ];
                                    updateAnswer(section, answerIndex, {
                                      number: newNumbers,
                                    });
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Number
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  value={answer.number}
                                  onChange={(e) =>
                                    updateAnswer(section, answerIndex, {
                                      number: parseInt(e.target.value),
                                    })
                                  }
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentNumber =
                                      answer.number as number;
                                    updateAnswer(section, answerIndex, {
                                      number: [
                                        currentNumber,
                                        currentNumber + 1,
                                      ],
                                      type: "multi-select-pair",
                                    });
                                  }}
                                >
                                  Make Multi
                                </Button>
                              </div>
                            )}
                          </div>

                          <div>
                            <Label>Answer Type</Label>
                            <Select
                              value={answer.type || "normal"}
                              onValueChange={(value) => {
                                const newType =
                                  value === "normal"
                                    ? undefined
                                    : (value as "multi-select-pair");

                                // Convert accepted format when changing type
                                let newAccepted = answer.accepted;
                                if (value === "multi-select-pair") {
                                  // Converting to multi-select-pair: ensure nested array format
                                  if (!Array.isArray(answer.accepted?.[0])) {
                                    // Current format is string[], convert to string[][]
                                    newAccepted = (
                                      answer.accepted as string[]
                                    ).map((a) => [a]);
                                  }
                                } else {
                                  // Converting to normal: flatten if nested
                                  if (Array.isArray(answer.accepted?.[0])) {
                                    // Current format is string[][], flatten to string[]
                                    newAccepted = (
                                      answer.accepted as string[][]
                                    ).map((group) => group[0] || "");
                                  }
                                }

                                updateAnswer(section, answerIndex, {
                                  type: newType,
                                  accepted: newAccepted,
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="multi-select-pair">
                                  Multi-select Pair
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Accepted Answers */}
                        <div>
                          <Label>Accepted Answers</Label>
                          {answer.type === "multi-select-pair" ? (
                            // Handle multi-select-pair with nested arrays
                            // Handle multi-select-pair with auto-generated permutations
                            <div className="space-y-2">
                              <div className="border p-3 rounded bg-blue-50">
                                <Label className="text-sm font-medium mb-2 block">
                                  Master Answer Set
                                </Label>
                                <div className="space-y-1">
                                  {/* Get the first group as the master set or create empty array */}
                                  {(() => {
                                    const masterSet = Array.isArray(
                                      answer.accepted?.[0]
                                    )
                                      ? (answer.accepted[0] as string[])
                                      : [];

                                    return masterSet.map(
                                      (acceptedAnswer, acceptedIndex) => (
                                        <div
                                          key={`${section}-master-${answerIndex}-${acceptedIndex}`}
                                          className="flex gap-1"
                                        >
                                          <Input
                                            value={acceptedAnswer}
                                            onChange={(e) => {
                                              const newMasterSet = [
                                                ...masterSet,
                                              ];
                                              newMasterSet[acceptedIndex] =
                                                e.target.value;

                                              // Generate all permutations
                                              const allPermutations =
                                                generatePermutations(
                                                  newMasterSet
                                                );

                                              updateAnswer(
                                                section,
                                                answerIndex,
                                                { accepted: allPermutations }
                                              );
                                            }}
                                            placeholder={`Answer ${
                                              acceptedIndex + 1
                                            }`}
                                          />
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              const newMasterSet =
                                                masterSet.filter(
                                                  (_, i) => i !== acceptedIndex
                                                );

                                              // Generate all permutations of the new set
                                              const allPermutations =
                                                newMasterSet.length > 0
                                                  ? generatePermutations(
                                                      newMasterSet
                                                    )
                                                  : [[]];

                                              updateAnswer(
                                                section,
                                                answerIndex,
                                                { accepted: allPermutations }
                                              );
                                            }}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )
                                    );
                                  })()}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const currentMasterSet = Array.isArray(
                                        answer.accepted?.[0]
                                      )
                                        ? (answer.accepted[0] as string[])
                                        : [];
                                      const newMasterSet = [
                                        ...currentMasterSet,
                                        "",
                                      ];

                                      // Generate all permutations
                                      const allPermutations =
                                        generatePermutations(newMasterSet);

                                      updateAnswer(section, answerIndex, {
                                        accepted: allPermutations,
                                      });
                                    }}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Answer
                                  </Button>
                                </div>
                                <div className="mt-2 text-xs text-gray-600">
                                  {Array.isArray(answer.accepted) &&
                                    answer.accepted.length > 0 && (
                                      <p>
                                        ✨ Auto-generated{" "}
                                        {answer.accepted.length} permutation
                                        {answer.accepted.length !== 1
                                          ? "s"
                                          : ""}{" "}
                                        from{" "}
                                        {Array.isArray(answer.accepted[0])
                                          ? answer.accepted[0].length
                                          : 0}{" "}
                                        answer
                                        {Array.isArray(answer.accepted[0]) &&
                                        answer.accepted[0].length !== 1
                                          ? "s"
                                          : ""}
                                      </p>
                                    )}
                                </div>
                              </div>

                              {/* Show all generated permutations (read-only) */}
                              <div className="border p-3 rounded bg-gray-50">
                                <Label className="text-sm font-medium mb-2 block">
                                  All Generated Permutations (Read-only)
                                </Label>
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                  {(Array.isArray(answer.accepted)
                                    ? answer.accepted
                                    : []
                                  ).map((permutation, permIndex) => (
                                    <div
                                      key={`${section}-perm-${answerIndex}-${permIndex}`}
                                      className="text-sm p-2 bg-white rounded border"
                                    >
                                      {permIndex + 1}.{" "}
                                      {Array.isArray(permutation)
                                        ? permutation.join(", ")
                                        : ""}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Handle normal answers
                            <div className="space-y-1">
                              {(Array.isArray(answer.accepted)
                                ? answer.accepted
                                : []
                              ).map((acceptedAnswer, acceptedIndex) => (
                                <div
                                  key={`${section}-accepted-${answerIndex}-${acceptedIndex}`}
                                  className="flex gap-1"
                                >
                                  <Input
                                    value={acceptedAnswer}
                                    onChange={(e) => {
                                      const newAccepted = [
                                        ...(answer.accepted as string[]),
                                      ];
                                      newAccepted[acceptedIndex] =
                                        e.target.value;
                                      updateAnswer(section, answerIndex, {
                                        accepted: newAccepted,
                                      });
                                    }}
                                    placeholder="Accepted answer..."
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newAccepted = (
                                        answer.accepted as string[]
                                      ).filter((_, i) => i !== acceptedIndex);
                                      updateAnswer(section, answerIndex, {
                                        accepted: newAccepted,
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newAccepted = [
                                    ...(answer.accepted as string[]),
                                    "",
                                  ];
                                  updateAnswer(section, answerIndex, {
                                    accepted: newAccepted,
                                  });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Accepted Answer
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {/* Add Answer Button */}
                <div className="flex gap-2">
                  <Select
                    onValueChange={(value) =>
                      addAnswer(section, parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select question number" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 40 }, (_, i) => i + 1)
                        .filter(
                          (num) =>
                            !sectionAnswers.answers.some((a) =>
                              Array.isArray(a.number)
                                ? a.number.includes(num)
                                : a.number === num
                            )
                        )
                        .map((num) => (
                          <SelectItem
                            key={`${section}-select-${num}`}
                            value={num.toString()}
                          >
                            Question {num}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {sectionAnswers.answers.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No correct answers added yet. Use "Auto-populate All" or
                    select question numbers manually.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
