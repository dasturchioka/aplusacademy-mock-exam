"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScrollAndFocus } from "@/hooks/useScrollAndFocus";
import { defaultInstance as axios } from "@/http/index";
import { AnswerStorage, STORAGE_KEYS } from "@/lib/answerHandlers";
import { SectionCompletion } from "@/lib/sectionCompletion";
import { useQuestionNumbersStore } from "@/lib/stores/answeredQuestionsStore";
import { useAnswerStore } from "@/lib/stores/answerStore";
import { AlertTriangle, Clock, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PartIndicator } from "./PartIndicator";
import QuestionBlockRenderer from "./QuestionBlockRenderer";
import { SectionOptions } from "./SectionOptions";
import TextHighlighter from "./TextHighlighter";
import SectionCompleteButton from "./SectionCompleteButton";

interface ListeningPart {
  part: string;
  questionsRange: string;
  questionBlocks: any[];
}

interface ListeningData {
  parts: ListeningPart[];
}

// Add new sessionStorage keys for reload persistence
const LISTENING_SESSION_KEYS = {
  AUDIO_TIME: "listening_audio_time",
  TIMER_REMAINING: "listening_timer_remaining",
  ACTIVE_PART: "listening_active_part",
  HAS_STARTED: "listening_has_started",
  SESSION_ACTIVE: "listening_session_active",
  USER_ID: "listening_user_id",
  EXAM_START_TIME: "listening_exam_start_time",
  AUDIO_FINISHED: "listening_audio_finished",
  SHOW_COUNTDOWN: "listening_show_countdown",
};

interface ListeningSectionProps {
  userId: string;
  onComplete: () => void;
  timeLimit?: number;
}

export default function ListeningSection({
  userId,
  onComplete,
  timeLimit = 32 * 60, // Changed to 20 seconds for testing
}: ListeningSectionProps) {
  const scrollAndFocus = useScrollAndFocus();
  const questionNumbers = useQuestionNumbersStore(
    (state) => state.questionNumbers
  );
  // State
  const [currentPart, setCurrentPart] = useState("1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasStarted, setHasStarted] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [listeningData, setListeningData] = useState<ListeningData | null>(
    null
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [isTimeoutCompleting, setIsTimeoutCompleting] = useState(false);
  const [inputsDisabled, setInputsDisabled] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isPlayingEndingAudio, setIsPlayingEndingAudio] = useState(false);

  // NEW: Audio-driven timer state
  const [audioFinished, setAudioFinished] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);

  // NEW: Reload persistence state
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<any>(null);
  const [shouldRestoreAudio, setShouldRestoreAudio] = useState(false); // NEW: Flag for audio restoration
  const [forceRerender, setForceRerender] = useState(0); // NEW: Force re-render trigger

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const endingAudioRef = useRef<HTMLAudioElement>(null);

  // Store
  const {
    setCurrentSection,
    getAnswer,
    initializeTest,
    submitAnswers,
    setAnswer,
  } = useAnswerStore();

  // NEW: Check for existing session on mount (before other effects)
  useEffect(() => {
    const checkForReload = () => {
      const sessionActive = sessionStorage.getItem(
        LISTENING_SESSION_KEYS.SESSION_ACTIVE
      );
      const savedUserId = sessionStorage.getItem(
        LISTENING_SESSION_KEYS.USER_ID
      );
      const hasStarted = sessionStorage.getItem(
        LISTENING_SESSION_KEYS.HAS_STARTED
      );

      // Check if there was an active session for the same user
      if (
        sessionActive === "true" &&
        savedUserId === userId &&
        hasStarted === "true"
      ) {
        const savedData = {
          audioTime: parseFloat(
            sessionStorage.getItem(LISTENING_SESSION_KEYS.AUDIO_TIME) || "0"
          ),
          timerRemaining: parseInt(
            sessionStorage.getItem(LISTENING_SESSION_KEYS.TIMER_REMAINING) ||
              "120"
          ),
          activePart:
            sessionStorage.getItem(LISTENING_SESSION_KEYS.ACTIVE_PART) || "1",
          examStartTime: sessionStorage.getItem(
            LISTENING_SESSION_KEYS.EXAM_START_TIME
          ),
          audioFinished:
            sessionStorage.getItem(LISTENING_SESSION_KEYS.AUDIO_FINISHED) ===
            "true",
          showCountdown:
            sessionStorage.getItem(LISTENING_SESSION_KEYS.SHOW_COUNTDOWN) ===
            "true",
        };

        setSavedSessionData(savedData);
        setShowReloadModal(true);
        setShowStartModal(false); // Don't show start modal if we're showing reload modal
      }
    };

    checkForReload();
  }, [userId, timeLimit]);

  useEffect(() => {
    console.log(questionNumbers);
  }, [questionNumbers]);

  // Set current section
  useEffect(() => {
    setCurrentSection("Listening");
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
        if (!test.listening) {
          throw new Error("No listening test data available");
        }

        setListeningData(test.listening);

        // Initialize the answer store with real test data
        initializeTest(userId, test.id);

        // Initialize AnswerStorage session for SectionCompletion system
        AnswerStorage.setTestSession(userId, test.id);

        // Set audio URL - construct proper backend URL
        if (test.listening_audios && test.listening_audios.length > 0) {
          const backendUrl = axios.defaults.baseURL || "http://localhost:3001";
          setAudioUrl(`${backendUrl}${test.listening_audios[0]}`);
        } else {
          // No audio available - start countdown immediately as fallback
          console.warn(
            "⚠️ No audio files found - starting fallback 2-minute timer"
          );
          setAudioFinished(true);
          setTimeLeft(2 * 60);
          setShowCountdown(true);
        }
      } catch (err: any) {
        console.error("Failed to fetch test data:", err);
        setError(err.message || "Failed to load test data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestData();
  }, [userId, initializeTest]);

  // Timer effect - only starts after audio finishes
  useEffect(() => {
    if (!hasStarted || !audioFinished || !showCountdown || timeLeft <= 0)
      return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout occurred - disable inputs immediately
          setInputsDisabled(true);
          setIsTimeoutCompleting(true);
          console.log("⏰ 2-minute countdown finished - disabling inputs");

          // Play ending audio
          const endingAudio = endingAudioRef.current;
          if (endingAudio) {
            console.log("🎵 Playing ending audio...");
            setIsPlayingEndingAudio(true);
            endingAudio.play().catch((err) => {
              console.error("Failed to play ending audio:", err);
              setIsPlayingEndingAudio(false);
            });

            // Wait for ending audio to finish, then save and navigate
            endingAudio.onended = async () => {
              console.log("✅ Ending audio finished - now saving results");
              setIsPlayingEndingAudio(false);

              try {
                // Save answers then complete automatically on timeout
                const result = await SectionCompletion.completeSection(
                  "Listening"
                );

                if (result.success) {
                  console.log(
                    "✅ Listening section auto-completed successfully on timeout"
                  );

                  // Clear session data manually (same as handleCompleteExam)
                  Object.values(LISTENING_SESSION_KEYS).forEach((key) => {
                    sessionStorage.removeItem(key);
                  });

                  // Navigate directly without calling handleCompleteExam to avoid duplication
                  onComplete();
                } else {
                  console.error(
                    "❌ Failed to auto-complete Listening section:",
                    result.error
                  );
                  // Still navigate even if save failed to prevent being stuck
                  onComplete();
                }
              } catch (error) {
                console.error(
                  "❌ Error during Listening auto-completion:",
                  error
                );
                // Still navigate even if save failed to prevent being stuck
                onComplete();
              }
            };
          } else {
            // If audio element not found, fallback to original behavior
            console.warn("⚠️ Ending audio element not found - proceeding without audio");
            setTimeout(async () => {
              try {
                const result = await SectionCompletion.completeSection(
                  "Listening"
                );

                if (result.success) {
                  console.log(
                    "✅ Listening section auto-completed successfully on timeout"
                  );

                  Object.values(LISTENING_SESSION_KEYS).forEach((key) => {
                    sessionStorage.removeItem(key);
                  });

                  onComplete();
                } else {
                  console.error(
                    "❌ Failed to auto-complete Listening section:",
                    result.error
                  );
                  onComplete();
                }
              } catch (error) {
                console.error(
                  "❌ Error during Listening auto-completion:",
                  error
                );
                onComplete();
              }
            }, 1000);
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, audioFinished, showCountdown, timeLeft, onComplete]);

  // NEW: Save session state continuously
  useEffect(() => {
    if (hasStarted) {
      // Mark session as active
      sessionStorage.setItem(LISTENING_SESSION_KEYS.SESSION_ACTIVE, "true");
      sessionStorage.setItem(LISTENING_SESSION_KEYS.USER_ID, userId);
      sessionStorage.setItem(LISTENING_SESSION_KEYS.HAS_STARTED, "true");

      // Save current state
      sessionStorage.setItem(
        LISTENING_SESSION_KEYS.TIMER_REMAINING,
        timeLeft.toString()
      );
      sessionStorage.setItem(LISTENING_SESSION_KEYS.ACTIVE_PART, currentPart);
      sessionStorage.setItem(
        LISTENING_SESSION_KEYS.AUDIO_FINISHED,
        audioFinished.toString()
      );
      sessionStorage.setItem(
        LISTENING_SESSION_KEYS.SHOW_COUNTDOWN,
        showCountdown.toString()
      );

      if (!sessionStorage.getItem(LISTENING_SESSION_KEYS.EXAM_START_TIME)) {
        sessionStorage.setItem(
          LISTENING_SESSION_KEYS.EXAM_START_TIME,
          Date.now().toString()
        );
      }
    }
  }, [hasStarted, timeLeft, currentPart, audioFinished, showCountdown, userId]);

  // Audio effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // initialize volume
      audio.volume = volume;
      if (shouldAutoPlay) {
        audio.play().catch((err) => {
          console.error("Autoplay failed:", err);
        });
        setIsPlaying(true);
        setShouldAutoPlay(false);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // NEW: Save audio position continuously
      if (hasStarted) {
        sessionStorage.setItem(
          LISTENING_SESSION_KEYS.AUDIO_TIME,
          audio.currentTime.toString()
        );
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setAudioFinished(true);
      // Start 2-minute countdown when audio ends
      setTimeLeft(2 * 60); // 2 minutes = 120 seconds
      setShowCountdown(true);
      console.log("🎵 Audio finished - starting 2-minute countdown");
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl, shouldAutoPlay, hasStarted]);

  // Volume change handler
  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  // NEW: Effect to restore audio position after modal is closed
  useEffect(() => {
    if (shouldRestoreAudio && savedSessionData) {
      const restoreAudioPosition = () => {
        const audio = audioRef.current;
        if (!audio) {
          console.log("🎵 Audio element not ready yet, will retry...");
          // Retry after a short delay
          setTimeout(() => {
            if (audioRef.current) {
              restoreAudioPosition();
            }
          }, 500);
          return;
        }

        try {
          console.log("🎵 Starting audio restoration...");

          // Set the audio position
          if (savedSessionData.audioTime > 0) {
            audio.currentTime = savedSessionData.audioTime;
            setCurrentTime(savedSessionData.audioTime);
            console.log(
              `🎵 Audio position restored to: ${savedSessionData.audioTime}s`
            );
          }

          // Only start playback if audio hasn't finished
          if (!savedSessionData.audioFinished) {
            // Start playback with multiple fallbacks
            const startPlayback = async () => {
              try {
                await audio.play();
                setIsPlaying(true);
                console.log("▶️ Audio resumed successfully");
              } catch (playError) {
                console.warn(
                  "Auto-play failed, requiring user interaction:",
                  playError
                );
                setIsPlaying(false);
              }
            };

            // Small delay to ensure position is set before playing
            setTimeout(startPlayback, 100);
          } else {
            console.log("🎵 Audio already finished - not starting playback");
          }
        } catch (error) {
          console.error("Failed to restore audio position:", error);
        }
      };

      // Check if answers are already in localStorage (they should be)
      const savedAnswers = AnswerStorage.getAnswers("Listening");
      console.log("📖 Answers already in localStorage:", savedAnswers);
      console.log(
        `✅ Found ${
          Object.keys(savedAnswers).length
        } saved answers - QuestionBlockRenderer will read these automatically`
      );

      // Force re-render of question components to pick up restored answers
      setForceRerender((prev) => prev + 1);
      console.log(
        "🔄 Forcing re-render of question components to display restored answers"
      );

      // Restore audio position
      restoreAudioPosition();
      setShouldRestoreAudio(false); // Reset the flag
    }
  }, [shouldRestoreAudio, savedSessionData]);

  // Audio controls
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error("Audio play failed:", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const restartAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Start exam
  const handleStartExam = () => {
    setShowStartModal(false);
    setHasStarted(true);
    setShouldAutoPlay(true); // defer playback to audio-ready effect
  };

  // NEW: Handle continue from reload
  const handleContinueFromReload = () => {
    if (!savedSessionData) return;

    // ✅ FIX 1: Restore all state
    setTimeLeft(savedSessionData.timerRemaining);
    setCurrentPart(savedSessionData.activePart);
    setHasStarted(true);
    setShowReloadModal(false);

    // ✅ NEW: Restore audio-driven timer state
    if (savedSessionData.audioFinished) {
      setAudioFinished(true);
      setShowCountdown(true);
    }

    // ✅ FIX 2: Set flag to trigger audio restoration after component renders
    setShouldRestoreAudio(true);

    console.log("📍 Resumed listening exam:", {
      audioTime: savedSessionData.audioTime,
      timerRemaining: savedSessionData.timerRemaining,
      activePart: savedSessionData.activePart,
      audioFinished: savedSessionData.audioFinished,
      answersRestored: Object.keys(AnswerStorage.getAnswers("Listening"))
        .length,
    });
  };

  // Complete exam with answer submission
  const handleCompleteExam = () => {
    // Clear session data when exam is completed
    Object.values(LISTENING_SESSION_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });

    // Completion is handled automatically on timeout
    onComplete();
  };

  const partMeta = {
    "1": { start: 1, end: 10 },
    "2": { start: 11, end: 20 },
    "3": { start: 21, end: 30 },
    "4": { start: 31, end: 40 },
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading listening test...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="h-8 w-8 mx-auto" />
            </div>
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
              {savedSessionData.showCountdown && (
                <p>
                  ⏱️ Time remaining:{" "}
                  {formatTime(savedSessionData.timerRemaining)}
                </p>
              )}
              {savedSessionData.audioFinished &&
                !savedSessionData.showCountdown && (
                  <p>✅ Audio completed - Review time</p>
                )}
              {!savedSessionData.audioFinished && (
                <p>
                  🎵 Audio position: {formatTime(savedSessionData.audioTime)}
                </p>
              )}
              <p>📍 Part: {savedSessionData.activePart}</p>
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
                  sessionStorage.removeItem(LISTENING_SESSION_KEYS.AUDIO_TIME);
                  sessionStorage.removeItem(
                    LISTENING_SESSION_KEYS.TIMER_REMAINING
                  );
                  sessionStorage.removeItem(LISTENING_SESSION_KEYS.ACTIVE_PART);
                  sessionStorage.removeItem(LISTENING_SESSION_KEYS.HAS_STARTED);
                  sessionStorage.removeItem(
                    LISTENING_SESSION_KEYS.SESSION_ACTIVE
                  );
                  sessionStorage.removeItem(LISTENING_SESSION_KEYS.USER_ID);
                  sessionStorage.removeItem(
                    LISTENING_SESSION_KEYS.EXAM_START_TIME
                  );
                  sessionStorage.removeItem(
                    LISTENING_SESSION_KEYS.AUDIO_FINISHED
                  );
                  sessionStorage.removeItem(
                    LISTENING_SESSION_KEYS.SHOW_COUNTDOWN
                  );
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

  // Start Modal
  if (showStartModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-[800px]">
          <CardContent className="p-6 text-center">
            <div className="relative">
              <video
                id="listening-tutorial-video"
                className="w-full h-[500px] bg-black rounded-lg"
                preload="metadata"
                controls={true}
                onError={(e) => {
                  console.error("Video failed to load:", e);
                  const video = e.target as HTMLVideoElement;
                  video.style.display = "none";
                  const errorDiv = document.createElement("div");
                  errorDiv.className =
                    "w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center";
                  errorDiv.innerHTML =
                    '<p class="text-gray-500">Tutorial video will be available soon</p>';
                  video.parentNode?.insertBefore(errorDiv, video);
                }}
              >
                <source src="/videos/listening-tutorial.mp4" type="video/mp4" />
                <p className="text-center text-gray-500 p-8">
                  Your browser does not support the video tag. Please use a
                  modern browser.
                </p>
              </video>
            </div>

            <h2 className="text-xl font-semibold my-4">Ready to Start?</h2>
            <p className="text-gray-600 mb-6">
              The listening test will begin with the audio. After the audio
              finishes, you'll have 2 minutes to review and complete your
              answers.
            </p>
            <Button onClick={handleStartExam} className="w-full">
              Start Listening Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 exam-section">
      {/* Header */}
      <div className="bg-white border-b fixed top-0 w-full z-50 shadow">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">IELTS Listening</h1>
              <Badge variant="outline">Questions 1-40</Badge>
              <SectionOptions />
            </div>
            <div className="flex items-center space-x-4">
              {isPlayingEndingAudio && (
                <div className="flex items-center space-x-2 text-red-600 animate-pulse">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    That is the end of the listening test
                  </span>
                </div>
              )}
              {!isPlayingEndingAudio && showCountdown && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-lg">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              {!showCountdown && audioFinished && !isPlayingEndingAudio && (
                <div className="flex items-center space-x-2 text-green-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Audio Complete - Review your answers
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {showCountdown && audioFinished ? null : (
        <div className="bg-white border-b mt-16">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {process.env.NODE_ENV === "development" && (
                        <span className="text-sm">
                          {formatTime(currentTime)}
                        </span>
                      )}
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{
                            width:
                              duration > 0
                                ? `${(currentTime / duration) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-[160px]">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) =>
                        handleVolumeChange(parseFloat(e.target.value))
                      }
                      className="w-28 accent-blue-600"
                      aria-label="Volume"
                    />
                    <Volume2 className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
                {audioUrl && (
                  <audio ref={audioRef} src={audioUrl} preload="metadata" />
                )}
                {/* Ending audio - plays when 2-minute countdown finishes */}
                <audio
                  ref={endingAudioRef}
                  src="/audios/thatistheendofthelisteningtest.mp3"
                  preload="auto"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 exam-content pb-26">
        <Tabs
          value={currentPart}
          onValueChange={setCurrentPart}
          className="w-full"
        >
          {listeningData?.parts.map((part) => (
            <TabsContent
              forceMount
              className="data-[state=inactive]:hidden space-y-6"
              key={part.part}
              value={part.part}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Part {part.part}</CardTitle>
                    <Badge variant="secondary">
                      Questions {part.questionsRange}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {part.questionBlocks.map((block, index) => (
                    <TextHighlighter
                      key={`${block.id ?? index}-${forceRerender}`}
                    >
                      <QuestionBlockRenderer
                        key={`${block.id}-${forceRerender}`}
                        questionBlock={block}
                        section="Listening"
                        part={part.part}
                        className="question-block"
                        disabled={inputsDisabled}
                      />
                    </TextHighlighter>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          {/* Navigation Button removed: section completes automatically on timeout */}
          {/* Section complete button shown above bottom tabs */}
           {/* {currentPart == "4" && (
            <div className="w-full px-4 py-4 bg-white border-t">
              <div className="flex justify-end">
                <SectionCompleteButton
                  section="Listening"
                  onSectionComplete={handleCompleteExam}
                  disabled={inputsDisabled || isTimeoutCompleting}
                />
              </div>
            </div>
          )}  */}
        </Tabs>
      </div>

      {/* Tabs at BOTTOM EDGE of screen */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-4">
        <div className="mx-auto px-4 py-2 space-y-3">
          <Tabs
            value={currentPart}
            onValueChange={setCurrentPart}
            className="w-full bg-white"
          >
            <TabsList className="grid w-full grid-cols-4">
              {listeningData?.parts.map((part) => (
                <TabsTrigger
                  key={part.part}
                  value={part.part}
                  className="flex items-center justify-center cursor-pointer"
                >
                  Part {part.part}
                  <PartIndicator
                    section="Listening"
                    questionStart={
                      partMeta[part.part as keyof typeof partMeta].start
                    }
                    questionEnd={
                      partMeta[part.part as keyof typeof partMeta].end
                    }
                  />
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
