"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultInstance as axios } from "@/http/index";
import {
  flushDirtyAutosave,
  saveSectionAndWait,
  scheduleDirtyAutosave,
} from "@/lib/examSaveRunner";
import { useQuestionNumbersStore } from "@/lib/stores/answeredQuestionsStore";
import { useAnswerStore } from "@/lib/stores/answerStore";
import type { Test } from "@/types/db";
import { AlertTriangle, Clock, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  ExamSaveStatus,
  type ExamSaveStatusValue,
} from "@/components/exam/ExamSaveStatus";
import { PartIndicator } from "./PartIndicator";
import QuestionBlockRenderer from "./QuestionBlockRenderer";
import InlineMatchHeading, {
  ParagraphDropZone,
} from "./reading/InlineMatchHeading";
import { SectionOptions } from "./SectionOptions";
import TextHighlighter from "./TextHighlighter";

interface ReadingPassage {
  part: string;
  passage: {
    headline: string;
    subHeadline?: string;
    paragraphs: {
      tag?: string;
      header?: string;
      content: string;
      droppableArea?: boolean;
      questionNumber?: number;
    }[];
  };
  instructions: string;
  questionBlocks: any[];
  questionStart: string;
  questionEnd: string;
}

interface ReadingData {
  passages: ReadingPassage[];
}

// Add new sessionStorage keys for Reading session persistence
const READING_SESSION_KEYS = {
  TIMER_REMAINING: "reading_timer_remaining",
  ACTIVE_PASSAGE: "reading_active_passage",
  HAS_STARTED: "reading_has_started",
  SESSION_ACTIVE: "reading_session_active",
  USER_ID: "reading_user_id",
  EXAM_START_TIME: "reading_exam_start_time",
};

interface ReadingSectionProps {
  userId: string;
  test?: Test | null;
  onComplete: () => void;
  timeLimit?: number;
}

export default function ReadingSection({
  userId,
  test: initialTest,
  onComplete,
  timeLimit = 60 * 60, // Changed to 20 seconds for testing
}: ReadingSectionProps) {
  const questionNumbers = useQuestionNumbersStore(
    (state) => state.questionNumbers
  );
  // State
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasStarted, setHasStarted] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [readingData, setReadingData] = useState<ReadingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPassage, setCurrentPassage] = useState("1");
  const [isTimeoutCompleting, setIsTimeoutCompleting] = useState(false);
  const [inputsDisabled, setInputsDisabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<ExamSaveStatusValue>("saving");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Match heading state
  const [matchHeadingAnswers, setMatchHeadingAnswers] = useState<
    Record<string, Array<{ number: number; answer: string }>>
  >({});
  const pendingSaveVersionRef = useRef(0);

  // Store
  const { setCurrentSection, initializeTest } = useAnswerStore();

  const markAutosaveDirty = (delayMs: number) => {
    pendingSaveVersionRef.current += 1;
    const saveVersion = pendingSaveVersionRef.current;
    setSaveStatus("saving");
    setSaveError(null);
    scheduleDirtyAutosave(
      "Reading",
      {
        onSaving: () => {
          setSaveStatus("saving");
          setSaveError(null);
        },
        onSaved: () => {
          if (pendingSaveVersionRef.current !== saveVersion) {
            setSaveStatus("saving");
            setSaveError(null);
            return;
          }
          setSaveStatus("saved");
          setSaveError(null);
        },
        onError: (error) => {
          const message =
            error.message ||
            "Autosave failed. Keep this page open and call an administrator.";
          setSaveStatus("failed");
          setSaveError(message);
        },
      },
      { idleDelayMs: delayMs }
    );
  };

  useEffect(() => {
    const savedUserId = sessionStorage.getItem(READING_SESSION_KEYS.USER_ID);
    const wasStarted =
      savedUserId === userId &&
      sessionStorage.getItem(READING_SESSION_KEYS.HAS_STARTED) === "true";

    if (!wasStarted) return;

    const savedTimeLeft = Number(
      sessionStorage.getItem(READING_SESSION_KEYS.TIMER_REMAINING)
    );
    const savedActivePassage = sessionStorage.getItem(
      READING_SESSION_KEYS.ACTIVE_PASSAGE
    );

    if (Number.isFinite(savedTimeLeft)) setTimeLeft(savedTimeLeft);
    if (savedActivePassage) setCurrentPassage(savedActivePassage);

    setHasStarted(true);
    setShowStartModal(false);
  }, [userId]);

  // Set current section
  useEffect(() => {
    setCurrentSection("Reading");
  }, [setCurrentSection]);

  // Fetch test data
  useEffect(() => {
    const fetchTestData = async () => {
      try {
	        setIsLoading(true);
		        const test =
		          initialTest ||
		          (await axios.get(`/api/exam/active/${userId}`)).data.test;

        if (!test.reading) {
          throw new Error("No reading test data available");
        }

        setReadingData(test.reading);

        // Initialize the answer store with real test data
        initializeTest(userId, test.id);

        // Initialize match heading answers for all passages that have match-heading questions
        const initialMatchHeadingAnswers: Record<
          string,
          Array<{ number: number; answer: string }>
        > = {};
        test.reading.passages.forEach((passage: ReadingPassage) => {
          const matchQuestion = passage.questionBlocks?.find(
            (block: any) => block.type === "match-heading"
          );
          if (matchQuestion) {
            // For match-heading, generate questions based on paragraphs with droppableArea
            const matchHeadingQuestions: Array<{
              number: number;
              answer: string;
            }> = [];

            passage.passage.paragraphs.forEach((paragraph: any) => {
              if (
                paragraph.droppableArea &&
                paragraph.questionNumber &&
                paragraph.questionNumber > 0
              ) {
                matchHeadingQuestions.push({
                  number: paragraph.questionNumber,
                  answer: "", // Start with empty answers
                });
              }
            });

            if (matchHeadingQuestions.length > 0) {
              initialMatchHeadingAnswers[passage.part] = matchHeadingQuestions;
            }
          }
        });
        setMatchHeadingAnswers(initialMatchHeadingAnswers);
      } catch (err: any) {
        console.error("Failed to fetch test data:", err);
        setError(err.message || "Failed to load test data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestData();
  }, [userId, initializeTest, initialTest]);

  useEffect(() => {
    if (!hasStarted) return;

    const handleAnswersUpdated = () => {
      markAutosaveDirty(1500);
    };

    window.addEventListener("answersUpdated", handleAnswersUpdated);

    return () => {
      window.removeEventListener("answersUpdated", handleAnswersUpdated);
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    markAutosaveDirty(1000);

    return () => {
      void flushDirtyAutosave("Reading").catch(() => undefined);
    };
  }, [hasStarted]);

  // Timer effect
  useEffect(() => {
    if (!hasStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout occurred - disable inputs and auto-complete
          setInputsDisabled(true);
          setIsTimeoutCompleting(true);

          // Queue the section save after the timeout UI settles
          setTimeout(async () => {
            await handleQueuedTimeoutCompletion();
          }, 1000);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeLeft, onComplete]);

  // NEW: Save session state continuously
  useEffect(() => {
    if (hasStarted) {
      // Mark session as active
      sessionStorage.setItem(READING_SESSION_KEYS.SESSION_ACTIVE, "true");
      sessionStorage.setItem(READING_SESSION_KEYS.USER_ID, userId);
      sessionStorage.setItem(READING_SESSION_KEYS.HAS_STARTED, "true");

      // Save current state
      sessionStorage.setItem(
        READING_SESSION_KEYS.TIMER_REMAINING,
        timeLeft.toString()
      );
      sessionStorage.setItem(
        READING_SESSION_KEYS.ACTIVE_PASSAGE,
        currentPassage
      );

      if (!sessionStorage.getItem(READING_SESSION_KEYS.EXAM_START_TIME)) {
        sessionStorage.setItem(
          READING_SESSION_KEYS.EXAM_START_TIME,
          Date.now().toString()
        );
      }

      scheduleDirtyAutosave("Reading", undefined, { idleDelayMs: 15000 });
    }
  }, [hasStarted, timeLeft, currentPassage, userId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const clearReadingSessionKeys = () => {
    Object.values(READING_SESSION_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });
  };

  const handleQueuedTimeoutCompletion = async () => {
    setSaveStatus("saving");
    setSaveError(null);

    try {
      await flushDirtyAutosave("Reading");
      await saveSectionAndWait("Reading");
      setSaveStatus("saved");
      clearReadingSessionKeys();
      onComplete();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save your Reading answers. Do not close this page. Call an administrator.";
      console.error("Failed to queue Reading section save:", error);
      setSaveStatus("failed");
      setSaveError(message);
      setError(message);
    }
  };

  // Start exam
  const handleStartExam = () => {
    setShowStartModal(false);
    setHasStarted(true);
  };

  // Helper function to detect if passage has match-heading questions
  const getMatchHeadingQuestion = (passage: ReadingPassage) => {
    if (
      !passage ||
      !passage.questionBlocks ||
      !Array.isArray(passage.questionBlocks)
    ) {
      return null;
    }

    const matchQuestion = passage.questionBlocks.find(
      (block) => block.type === "match-heading"
    );

    // For match-heading, we only need options and instructions, not questions array
    if (
      matchQuestion &&
      (!matchQuestion.options || !Array.isArray(matchQuestion.options))
    ) {
      console.warn(
        "Match heading question found but missing options array:",
        matchQuestion
      );
      return null;
    }

    return matchQuestion;
  };

  // Handle match heading answer changes
  const handleMatchHeadingAnswerChange = (
    passagePart: string,
    answers: Array<{ number: number; answer: string }>
  ) => {
    setMatchHeadingAnswers((prev) => ({
      ...prev,
      [passagePart]: answers,
    }));

    // Update individual answers in the store
    answers.forEach((answer) => {
      // Use the answer handler to store the answer
      const answerHandlers = require("@/lib/answerHandlers");
      answerHandlers.AnswerStorage.saveAnswer(
        "Reading",
        answer.number.toString(),
        answer.answer
      );
    });
  };

  useEffect(() => {
    console.log(questionNumbers);
  }, [questionNumbers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reading test...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="mb-4 text-[var(--danger)]">
              <AlertTriangle className="h-8 w-8 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Test</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!readingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No Test Data</h3>
            <p className="text-gray-600">No reading test data is available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showStartModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-[800px]">
          <CardHeader>
            <CardTitle className="text-center">IELTS Reading Test</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <video
              className="w-full h-[500px] bg-black rounded-lg"
              controls={true}
              preload="metadata"
            >
              <source src="/videos/reading-tutorial.mp4" type="video/mp4" />
              <p className="text-center text-gray-500 p-8">
                Your browser does not support the video tag. Please use a modern
                browser.
              </p>
            </video>
            <div className="text-center space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Instructions</h3>
                <ul className="text-sm text-left space-y-1">
                  <li>• Read the passages carefully</li>
                  <li>• You can highlight text by selecting it</li>
                  <li>• Use the resizable panels to adjust your view</li>
                  <li>
                    • You have {Math.floor(timeLimit / 60)} minutes to complete
                  </li>
                  <li>• Click "Start Reading Test" when ready</li>
                </ul>
              </div>
              <Button onClick={handleStartExam} className="w-full" size="lg">
                <FileText className="mr-2 h-4 w-4" />
                Start Reading Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 exam-section">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">IELTS Reading</h1>
              <Badge variant="outline">Questions 1-40</Badge>
              <SectionOptions />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <ExamSaveStatus status={saveStatus} error={saveError} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width with Resizable Panels */}
      <div className="h-[calc(100vh-180px)] w-full pb-10">
        {readingData.passages.map((passage) => {
          const matchHeadingQuestion = getMatchHeadingQuestion(passage);
          const currentAnswers = matchHeadingAnswers[passage.part] || [];

          return (
            <div
              key={passage.part}
              className={`h-full ${
                currentPassage === passage.part ? "block" : "hidden"
              }`}
            >
              <DndProvider backend={HTML5Backend}>
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  {/* Left Panel - Passage Content */}
                  <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex-shrink-0">
                        <CardTitle className="flex items-center justify-between">
                          {passage.passage.headline}
                          {matchHeadingQuestion && (
                            <Badge variant="outline" className="text-xs">
                              Match Headings: {currentAnswers.length}/
                              {matchHeadingQuestion.options.length} available
                            </Badge>
                          )}
                        </CardTitle>
                        {passage.passage.subHeadline ? (
                          <CardTitle className="flex items-center justify-between">
                            {passage.passage.subHeadline}
                          </CardTitle>
                        ) : null}
                      </CardHeader>
                      <CardContent className="exam-content flex-1 overflow-y-auto p-4 pt-16">
                        <div className="space-y-4 overflow-y-visible">
                          {passage.passage.paragraphs.map((paragraph, idx) => (
                            <div
                              key={idx}
                              className="space-y-2 overflow-y-visible"
                            >
                              {/* Render drop zone if this paragraph has match-heading question */}
                              {matchHeadingQuestion &&
                                paragraph.droppableArea &&
                                paragraph.questionNumber &&
                                paragraph.questionNumber > 0 && (
                                  <ParagraphDropZone
                                    questionNumber={paragraph.questionNumber}
                                    question={matchHeadingQuestion}
                                    userAnswers={currentAnswers}
                                    onAnswerChange={(
                                      questionNumber,
                                      headingVariant
                                    ) => {
                                      const updated = [
                                        ...currentAnswers.filter(
                                          (ans) => ans.number !== questionNumber
                                        ),
                                        {
                                          number: questionNumber,
                                          answer: headingVariant,
                                        },
                                      ];
                                      handleMatchHeadingAnswerChange(
                                        passage.part,
                                        updated
                                      );
                                    }}
                                    onSwapAnswers={(source, target) => {
                                      const updated = [...currentAnswers];
                                      const sourceIndex = updated.findIndex(
                                        (ans) => ans.number === source
                                      );
                                      const targetIndex = updated.findIndex(
                                        (ans) => ans.number === target
                                      );

                                      if (
                                        sourceIndex !== -1 &&
                                        targetIndex !== -1
                                      ) {
                                        const temp =
                                          updated[sourceIndex].answer;
                                        updated[sourceIndex].answer =
                                          updated[targetIndex].answer;
                                        updated[targetIndex].answer = temp;
                                        handleMatchHeadingAnswerChange(
                                          passage.part,
                                          updated
                                        );
                                      }
                                    }}
                                    onRemoveAnswer={(questionNumber) => {
                                      const updated = currentAnswers.map(
                                        (ans) =>
                                          ans.number === questionNumber
                                            ? { ...ans, answer: "" }
                                            : ans
                                      );
                                      handleMatchHeadingAnswerChange(
                                        passage.part,
                                        updated
                                      );
                                    }}
                                  />
                                )}

                              {paragraph.header && (
                                <h4 className="font-semibold text-gray-900">
                                  {paragraph.header}
                                </h4>
                              )}
                              <TextHighlighter className="text-gray-700 leading-relaxed">
                                {paragraph.tag && (
                                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                                    {paragraph.tag}
                                  </span>
                                )}
                                {paragraph.content}
                              </TextHighlighter>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Right Panel - Questions */}
                  <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                    <div className="h-full overflow-y-auto p-4 bg-gray-50">
                      <div className="space-y-6">
                        {/* Render match heading pool if present */}
                        {matchHeadingQuestion && (
                          <>
                            <InlineMatchHeading
                              question={matchHeadingQuestion}
                              currentAnswers={currentAnswers}
                              onAnswerChange={(answers) =>
                                handleMatchHeadingAnswerChange(
                                  passage.part,
                                  answers
                                )
                              }
                            />
                          </>
                        )}

                        {/* Render other question blocks */}
                        {passage.questionBlocks
                          .filter((block) => block.type !== "match-heading")
                          .map((block, index) => (
                            <TextHighlighter key={block.id ?? index}>
                              <QuestionBlockRenderer
                                key={block.id}
                                questionBlock={block}
                                section="Reading"
                                part={passage.part}
                                className="question-block bg-white rounded-lg shadow-sm border p-4"
                                disabled={inputsDisabled}
                              />
                            </TextHighlighter>
                          ))}
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </DndProvider>
            </div>
          );
        })}
        <div className="w-full px-4 pt-4 pb-10 bg-white border-t">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = readingData.passages.findIndex(
                  (p) => p.part === currentPassage
                );
                if (currentIndex > 0) {
                  setCurrentPassage(
                    readingData.passages[currentIndex - 1].part
                  );
                }
              }}
              disabled={currentPassage === "1"}
            >
              Previous Passage
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}

      {/* Tabs at BOTTOM EDGE of screen */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="px-4 pb-8 pt-2 space-y-3">
          
          
          <Tabs
            value={currentPassage}
            onValueChange={setCurrentPassage}
            className="w-full h-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              {readingData.passages.map((passage) => {
                return (
                  <TabsTrigger
                    key={passage.part}
                    value={passage.part}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <span>Passage {passage.part}</span>
                    <PartIndicator
                      section="Reading"
                      questionStart={+passage.questionStart}
                      questionEnd={+passage.questionEnd}
                    />
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
