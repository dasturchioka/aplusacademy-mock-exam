"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultInstance as axios } from "@/http/index";
import { AnswerStorage, STORAGE_KEYS } from "@/lib/answerHandlers";
import { SectionCompletion } from "@/lib/sectionCompletion";
import { useAnswerStore } from "@/lib/stores/answerStore";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  ZoomInIcon,
  ZoomOut,
  ZoomOutIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SectionOptions } from "./SectionOptions";
import SectionCompleteButton from "./SectionCompleteButton";
import { processTextWithBoldAndCaps } from "@/utils/highlightAsBold";

interface WritingTask {
  task: number;
  title: string;
  instructions: string[];
  prompt: string;
  timeAllocation: string;
  minWords: number;
  image?: string;
}

interface WritingData {
  tasks: WritingTask[];
}

// Add new sessionStorage keys for Writing session persistence
const WRITING_SESSION_KEYS = {
  TIMER_REMAINING: "writing_timer_remaining",
  ACTIVE_TASK: "writing_active_task",
  HAS_STARTED: "writing_has_started",
  SESSION_ACTIVE: "writing_session_active",
  USER_ID: "writing_user_id",
  EXAM_START_TIME: "writing_exam_start_time",
  TASK1_CONTENT: "writing_task1_content",
  TASK2_CONTENT: "writing_task2_content",
};

interface WritingSectionProps {
  userId: string;
  onComplete: () => void;
  timeLimit?: number;
}

export default function WritingSection({
  userId,
  onComplete,
  timeLimit = 60 * 60, // Changed to 20 seconds for testing
}: WritingSectionProps) {
  const [currentTask, setCurrentTask] = useState("1");
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasStarted, setHasStarted] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [writingData, setWritingData] = useState<WritingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task1Response, setTask1Response] = useState("");
  const [task2Response, setTask2Response] = useState("");
  const [isTimeoutCompleting, setIsTimeoutCompleting] = useState(false);
  const [inputsDisabled, setInputsDisabled] = useState(false);
  const [task1ImageSize, setTask1ImageSize] = useState(400);

  // NEW: Reload persistence state
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<any>(null);

  const { setCurrentSection, initializeTest, submitAnswers } = useAnswerStore();

  // NEW: Check for existing session on mount (before other effects)
  useEffect(() => {
    const checkForReload = () => {
      const sessionActive = sessionStorage.getItem(
        WRITING_SESSION_KEYS.SESSION_ACTIVE
      );
      const savedUserId = sessionStorage.getItem(WRITING_SESSION_KEYS.USER_ID);
      const hasStarted = sessionStorage.getItem(
        WRITING_SESSION_KEYS.HAS_STARTED
      );

      // Check if there was an active session for the same user
      if (
        sessionActive === "true" &&
        savedUserId === userId &&
        hasStarted === "true"
      ) {
        const savedData = {
          timerRemaining: parseInt(
            sessionStorage.getItem(WRITING_SESSION_KEYS.TIMER_REMAINING) ||
              timeLimit.toString()
          ),
          activeTask:
            sessionStorage.getItem(WRITING_SESSION_KEYS.ACTIVE_TASK) || "1",
          examStartTime: sessionStorage.getItem(
            WRITING_SESSION_KEYS.EXAM_START_TIME
          ),
          task1Content:
            sessionStorage.getItem(WRITING_SESSION_KEYS.TASK1_CONTENT) || "",
          task2Content:
            sessionStorage.getItem(WRITING_SESSION_KEYS.TASK2_CONTENT) || "",
        };

        setSavedSessionData(savedData);
        setShowReloadModal(true);
        setShowStartModal(false); // Don't show start modal if we're showing reload modal
      }
    };

    checkForReload();
  }, [userId, timeLimit]);

  useEffect(() => {
    setCurrentSection("Writing");
  }, [setCurrentSection]);

  useEffect(() => {
    const savedAnswers = AnswerStorage.getAnswers("Writing");
    if (savedAnswers.report) setTask1Response(savedAnswers.report);
    if (savedAnswers.essay) setTask2Response(savedAnswers.essay);
  }, []);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setIsLoading(true);

        // Fetch real test data from API
        const response = await axios.get(`/api/exam/active/${userId}`);

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch test data");
        }

        const test = response.data.test;
        if (test.writing) {
          // Use real writing data if available
          setWritingData(test.writing);
        }

        // Initialize with real test ID
        initializeTest(userId, test.id);

        // Initialize AnswerStorage session for SectionCompletion system
        AnswerStorage.setTestSession(userId, test.id);
      } catch (err: any) {
        console.error("Failed to fetch test data:", err);
        setError(err.message || "Failed to load test data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTestData();
  }, [userId, initializeTest]);

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
              const result = await SectionCompletion.completeSection("Writing");

              if (result.success) {
                console.log(
                  "✅ Writing section auto-completed successfully on timeout"
                );

                // Clear session data manually
                Object.values(WRITING_SESSION_KEYS).forEach((key) => {
                  sessionStorage.removeItem(key);
                });

                // Complete the entire exam directly without calling handleCompleteWriting to avoid duplication
                onComplete();
              } else {
                console.error(
                  "❌ Failed to auto-complete Writing section:",
                  result.error
                );
                // Still navigate even if save failed to prevent being stuck
                onComplete();
              }
            } catch (error) {
              console.error("❌ Error during Writing auto-completion:", error);
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
      sessionStorage.setItem(WRITING_SESSION_KEYS.SESSION_ACTIVE, "true");
      sessionStorage.setItem(WRITING_SESSION_KEYS.USER_ID, userId);
      sessionStorage.setItem(WRITING_SESSION_KEYS.HAS_STARTED, "true");

      // Save current state
      sessionStorage.setItem(
        WRITING_SESSION_KEYS.TIMER_REMAINING,
        timeLeft.toString()
      );
      sessionStorage.setItem(WRITING_SESSION_KEYS.ACTIVE_TASK, currentTask);
      sessionStorage.setItem(WRITING_SESSION_KEYS.TASK1_CONTENT, task1Response);
      sessionStorage.setItem(WRITING_SESSION_KEYS.TASK2_CONTENT, task2Response);

      if (!sessionStorage.getItem(WRITING_SESSION_KEYS.EXAM_START_TIME)) {
        sessionStorage.setItem(
          WRITING_SESSION_KEYS.EXAM_START_TIME,
          Date.now().toString()
        );
      }
    }
  }, [hasStarted, timeLeft, currentTask, task1Response, task2Response, userId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const wordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const handleTask1Change = (value: string) => {
    setTask1Response(value);
    AnswerStorage.saveAnswer("Writing", "report", value);
  };

  const handleTask2Change = (value: string) => {
    setTask2Response(value);
    AnswerStorage.saveAnswer("Writing", "essay", value);
  };

  const handleStartExam = () => {
    setShowStartModal(false);
    setHasStarted(true);
  };

  // NEW: Handle continue from reload
  const handleContinueFromReload = () => {
    if (!savedSessionData) return;

    // Restore all state
    setTimeLeft(savedSessionData.timerRemaining);
    setCurrentTask(savedSessionData.activeTask);
    setTask1Response(savedSessionData.task1Content);
    setTask2Response(savedSessionData.task2Content);
    setHasStarted(true);
    setShowReloadModal(false);

    // Restore answers to AnswerStorage as well
    if (savedSessionData.task1Content) {
      AnswerStorage.saveAnswer(
        "Writing",
        "report",
        savedSessionData.task1Content
      );
    }
    if (savedSessionData.task2Content) {
      AnswerStorage.saveAnswer(
        "Writing",
        "essay",
        savedSessionData.task2Content
      );
    }

    console.log("📍 Resumed writing exam:", {
      timerRemaining: savedSessionData.timerRemaining,
      activeTask: savedSessionData.activeTask,
      task1Words: wordCount(savedSessionData.task1Content),
      task2Words: wordCount(savedSessionData.task2Content),
    });
  };

  const handleCompleteWriting = () => {
    // Clear session data when exam is completed
    Object.values(WRITING_SESSION_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });

    // This will be handled by SectionCompleteButton
    onComplete();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading writing test...</p>
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
            <FileText className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Test</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
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
              <p>📍 Task: {savedSessionData.activeTask}</p>
              <p>📝 Task 1: {wordCount(savedSessionData.task1Content)} words</p>
              <p>📝 Task 2: {wordCount(savedSessionData.task2Content)} words</p>
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
                  Object.values(WRITING_SESSION_KEYS).forEach((key) => {
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
            <CardTitle className="text-center">IELTS Writing Test</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <video
              className="w-full h-[500px] bg-black rounded-lg"
              controls={true}
              preload="metadata"
            >
              <source src="/videos/writing-tutorial.mp4" type="video/mp4" />
              <p className="text-center text-gray-500 p-8">
                Your browser does not support the video tag. Please use a modern
                browser.
              </p>
            </video>

            <div className="text-center space-y-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Instructions</h3>
                <ul className="text-sm text-left space-y-1">
                  <li>• Complete both Writing tasks</li>
                  <li>• Task 1: Minimum 150 words (20 minutes suggested)</li>
                  <li>• Task 2: Minimum 250 words (40 minutes suggested)</li>
                  <li>• You have {Math.floor(timeLimit / 60)} minutes total</li>
                </ul>
              </div>
              <Button onClick={handleStartExam} className="w-full" size="lg">
                <FileText className="mr-2 h-4 w-4" />
                Start Writing Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 exam-section">
      <div className="bg-white border-b">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">IELTS Writing</h1>
              <Badge variant="outline">2 Tasks</Badge>
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

      <div className="h-[calc(100vh-180px)] w-full pb-16">
        {writingData?.tasks.map((task) => (
          <div
            key={task.task}
            className={`h-full ${
              currentTask == task.task.toString() ? "block" : "hidden"
            }`}
          >
            <div className="flex h-full">
              <div className="w-1/2 h-full overflow-y-auto p-4 bg-white border-r">
                <Card className="h-fit border-0 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      {task.task == 1
                        ? "Academic Writing Part 1"
                        : "Academic Writing Part 2"}
                    </CardTitle>
                    <p className="text-lg font-semibold instruction-text">
                      {task.task == 1
                        ? "You should spend about 20 minutes on this task. Write at least 150 words."
                        : "You should spend about 40 minutes on this task. Write at least 250 words."}
                    </p>
                  </CardHeader>
                  <div className="p-4 space-y-2 instruction-text">
                    {task.instructions.map((inst, index) => (
                      <p
                        key={index}
                        dangerouslySetInnerHTML={{
                          __html: processTextWithBoldAndCaps(inst),
                        }}
                      ></p>
                    ))}
                  </div>
                  <CardContent className="space-y-4 exam-text-scalable">
                    {task.task == 1 && task.image && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between space-x-2 mb-3">
                          <div className="left flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">
                              Chart/Diagram
                            </span>
                          </div>
                          {/* NEW: buttons for resizing */}
                          <div className="flex justify-center gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setTask1ImageSize((prev) =>
                                  Math.min(prev + 100, 1000)
                                )
                              } // max width 1000px
                            >
                              <ZoomInIcon />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setTask1ImageSize((prev) =>
                                  Math.max(prev - 100, 200)
                                )
                              } // min width 200px
                            >
                              <ZoomOutIcon />
                            </Button>
                          </div>
                        </div>
                        <img
                          src={task.image}
                          alt="Writing Task 1 Chart"
                          style={{
                            width: `${task1ImageSize}px`,
                            transition: "all .4s ease",
                          }} // ✅ controlled size
                          className="mx-auto rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="w-1/2 h-full overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-4">
                  <Card className="bg-white border shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Your Response</CardTitle>
                        <div className="text-sm text-gray-500">
                          {task.task == 1
                            ? `${wordCount(task1Response)} words`
                            : `${wordCount(task2Response)} words`}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="exam-text-scalable">
                      <textarea
                        value={task.task == 1 ? task1Response : task2Response}
                        onChange={(e) =>
                          task.task == 1
                            ? handleTask1Change(e.target.value)
                            : handleTask2Change(e.target.value)
                        }
                        disabled={inputsDisabled}
                        className="w-full h-96 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder={`Write your task ${task.task} here...`}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* {currentTask == "2" && (
        <div className="w-full px-4 py-4  bg-white border-t">
          <div className="flex justify-between">
            <SectionCompleteButton
              section="Writing"
              onSectionComplete={onComplete}
              disabled={inputsDisabled || isTimeoutCompleting}
            />
          </div>
        </div>
      )} */}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="px-4 py-1 space-y-3">
          <Tabs
            value={currentTask}
            onValueChange={setCurrentTask}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              {writingData?.tasks.map((task) => (
                <TabsTrigger
                  key={task.task}
                  value={task.task.toString()}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <span>Task {task.task}</span>
                  <span className="text-xs text-gray-500">
                    {task.task == 1
                      ? `${wordCount(task1Response)} words`
                      : `${wordCount(task2Response)} words`}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
