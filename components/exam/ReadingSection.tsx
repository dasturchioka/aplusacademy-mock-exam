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
import { AnswerStorage, STORAGE_KEYS } from "@/lib/answerHandlers";
import { SectionCompletion } from "@/lib/sectionCompletion";
import { useQuestionNumbersStore } from "@/lib/stores/answeredQuestionsStore";
import { useAnswerStore } from "@/lib/stores/answerStore";
import { AlertTriangle, Clock, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PartIndicator } from "./PartIndicator";
import QuestionBlockRenderer from "./QuestionBlockRenderer";
import InlineMatchHeading, {
  ParagraphDropZone,
} from "./reading/InlineMatchHeading";
import { SectionOptions } from "./SectionOptions";
import TextHighlighter from "./TextHighlighter";
import SectionCompleteButton from "./SectionCompleteButton";

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
  onComplete: () => void;
  timeLimit?: number;
}

export default function ReadingSection({
  userId,
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

  // NEW: Reload persistence state
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<any>(null);
  const [forceRerender, setForceRerender] = useState(0); // Force re-render trigger

  // Match heading state
  const [matchHeadingAnswers, setMatchHeadingAnswers] = useState<
    Record<string, Array<{ number: number; answer: string }>>
  >({});

  // Store
  const { setCurrentSection, getAnswer, initializeTest, submitAnswers } =
    useAnswerStore();

  // NEW: Check for existing session on mount (before other effects)
  useEffect(() => {
    const checkForReload = () => {
      const sessionActive = sessionStorage.getItem(
        READING_SESSION_KEYS.SESSION_ACTIVE
      );
      const savedUserId = sessionStorage.getItem(READING_SESSION_KEYS.USER_ID);
      const hasStarted = sessionStorage.getItem(
        READING_SESSION_KEYS.HAS_STARTED
      );

      // Check if there was an active session for the same user
      if (
        sessionActive === "true" &&
        savedUserId === userId &&
        hasStarted === "true"
      ) {
        const savedData = {
          timerRemaining: parseInt(
            sessionStorage.getItem(READING_SESSION_KEYS.TIMER_REMAINING) ||
              timeLimit.toString()
          ),
          activePassage:
            sessionStorage.getItem(READING_SESSION_KEYS.ACTIVE_PASSAGE) || "1",
          examStartTime: sessionStorage.getItem(
            READING_SESSION_KEYS.EXAM_START_TIME
          ),
        };

        setSavedSessionData(savedData);
        setShowReloadModal(true);
        setShowStartModal(false); // Don't show start modal if we're showing reload modal
      }
    };

    checkForReload();
  }, [userId, timeLimit]);

  // Set current section
  useEffect(() => {
    setCurrentSection("Reading");
  }, [setCurrentSection]);

  // Fetch test data
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/exam/active/${userId}`);

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch test data");
        }

        const test = response.data.test;
        if (!test.reading) {
          throw new Error("No reading test data available");
        }

        setReadingData(test.reading);

        // Initialize the answer store with real test data
        initializeTest(userId, test.id);

        // Initialize AnswerStorage session for SectionCompletion system
        AnswerStorage.setTestSession(userId, test.id);

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
  }, [userId, initializeTest]);

  // Timer effect
  useEffect(() => {
    if (!hasStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout occurred - disable inputs and auto-complete
          setInputsDisabled(true);
          setIsTimeoutCompleting(true);

          // Auto-complete the section with answer saving
          setTimeout(async () => {
            try {
              // Save answers then complete automatically on timeout
              const result = await SectionCompletion.completeSection("Reading");

              if (result.success) {
                console.log(
                  "✅ Reading section auto-completed successfully on timeout"
                );

                // Clear session data manually
                Object.values(READING_SESSION_KEYS).forEach((key) => {
                  sessionStorage.removeItem(key);
                });

                // Navigate directly without calling handleCompleteReading to avoid duplication
                onComplete();
              } else {
                console.error(
                  "❌ Failed to auto-complete Reading section:",
                  result.error
                );
                // Still navigate even if save failed to prevent being stuck
                onComplete();
              }
            } catch (error) {
              console.error("❌ Error during Reading auto-completion:", error);
              // Still navigate even if save failed to prevent being stuck
              onComplete();
            }
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
    }
  }, [hasStarted, timeLeft, currentPassage, userId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // NEW: Handle continue from reload
  const handleContinueFromReload = () => {
    if (!savedSessionData) return;

    // Restore all state
    setTimeLeft(savedSessionData.timerRemaining);
    setCurrentPassage(savedSessionData.activePassage);
    setHasStarted(true);
    setShowReloadModal(false);

    // Force re-render of question components to pick up restored answers
    setForceRerender((prev) => prev + 1);

    console.log("📍 Resumed reading exam:", {
      timerRemaining: savedSessionData.timerRemaining,
      activePassage: savedSessionData.activePassage,
      answersRestored: Object.keys(AnswerStorage.getAnswers("Reading")).length,
    });
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
            <div className="text-red-500 mb-4">⚠️</div>
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

  // NEW: Reload Modal
  if (showReloadModal && savedSessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="text-amber-500 mb-4">
              <AlertTriangle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              You just reloaded the page
            </h2>
            <p className="text-gray-600 mb-6">
              Press Continue if you wish to continue the exam from where you
              left off.
            </p>
            <div className="text-sm text-gray-500 mb-4 space-y-1">
              <p>
                ⏱️ Time remaining: {formatTime(savedSessionData.timerRemaining)}
              </p>
              <p>📍 Passage: {savedSessionData.activePassage}</p>
            </div>
            <div className="space-y-2">
              <Button onClick={handleContinueFromReload} className="w-full">
                Continue Exam
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Clear session and start fresh
                  sessionStorage.removeItem(STORAGE_KEYS.LISTENING_ANSWERS);
                  sessionStorage.removeItem(STORAGE_KEYS.READING_ANSWERS);
                  sessionStorage.removeItem(STORAGE_KEYS.WRITING_ANSWERS);
                  Object.values(READING_SESSION_KEYS).forEach((key) => {
                    sessionStorage.removeItem(key);
                  });
                  setShowReloadModal(false);
                  setShowStartModal(true);
                  setSavedSessionData(null);
                }}
                className="w-full"
              >
                Start Over
              </Button>
            </div>
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">
                  {formatTime(timeLeft)}
                </span>
              </div>
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
                                key={`${block.id}-${forceRerender}`}
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
            {/* Complete Section button removed: auto-finish on timeout */}
            {/* {currentPassage == "3" && (
              <SectionCompleteButton
                section="Reading"
                onSectionComplete={onComplete}
                disabled={inputsDisabled || isTimeoutCompleting}
              />
          )} */}
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
