"use client";

import AutoEvaluateAnswers from "@/components/admin/AutoEvaluateAnswers";
import { ResultAnalysisView } from "@/components/results/ResultAnalysisView";
import { ResultPublishingControls } from "@/components/results/ResultPublishingControls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppAlert } from "@/components/ui/app-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { defaultInstance as axios } from "@/http";
import { getAuthUser, logoutAuthSession } from "@/lib/authClient";
import { CorrectAnswersStructure } from "@/lib/answerEvaluation";
import { notify } from "@/lib/app-toast";
import { normalizeSectionsForReview, type ResultAnswer as Answer, type SectionResult } from "@/lib/resultAnalysis";
import {
  ArrowLeft,
  Hash,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface Test {
  id: string;
  title: string;
  edition?: string;
  correct_answers?: CorrectAnswersStructure | null;
}

interface Result {
  id: string;
  exam_taker_id: string;
  test_id: string;
  taken_date: string;
  results: SectionResult[];
  display_results?: SectionResult[] | null;
  listening_score: number | null;
  reading_score: number | null;
  writing_score: number | null;
  speaking_score: number | null;
  overall_score: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  email_sent: boolean;
  created_at: string;
  updated_at?: string;
  status?: string;
  completed_at?: string | null;
  attempt?: {
    id: string;
    status: string;
    current_section?: string | null;
    section_status?: Record<string, string> | null;
    last_activity_at?: string | null;
    completed_at?: string | null;
  } | null;
  users: User;
  tests: Test;
  feedback?: string | null;
  is_published: boolean;
  published_at: string | null;
  is_analysis_published: boolean;
  analysis_published_at: string | null;
}

// IELTS Band Score Conversion Tables
const LISTENING_SCORE_BANDS = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 32, max: 34, band: 7.5 },
  { min: 30, max: 31, band: 7.0 },
  { min: 26, max: 29, band: 6.5 },
  { min: 23, max: 25, band: 6.0 },
  { min: 18, max: 22, band: 5.5 },
  { min: 16, max: 17, band: 5.0 },
  { min: 13, max: 15, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 6, max: 9, band: 3.5 },
  { min: 4, max: 5, band: 3.0 },
  { min: 3, max: 3, band: 2.5 },
  { min: 2, max: 2, band: 2.0 },
  { min: 1, max: 1, band: 1.5 },
  { min: 0, max: 0, band: 1.0 },
];

const READING_SCORE_BANDS = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 33, max: 34, band: 7.5 },
  { min: 30, max: 32, band: 7.0 },
  { min: 27, max: 29, band: 6.5 },
  { min: 23, max: 26, band: 6.0 },
  { min: 19, max: 22, band: 5.5 },
  { min: 15, max: 18, band: 5.0 },
  { min: 13, max: 14, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 8, max: 9, band: 3.5 },
  { min: 6, max: 7, band: 3.0 },
  { min: 4, max: 5, band: 2.5 },
  { min: 3, max: 3, band: 2.0 },
  { min: 2, max: 2, band: 1.5 },
  { min: 0, max: 1, band: 1.0 },
];

export default function ResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.resultId as string;

  if (!resultId) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Invalid Result ID</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <AppAlert tone="error" title="Result unavailable">
                Result ID is missing.
              </AppAlert>
              <Button onClick={() => router.push("/admin/results")}>
                Return to Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const [result, setResult] = useState<Result | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [updatingPublishing, setUpdatingPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section scores
  const [listeningScore, setListeningScore] = useState<string>("");
  const [readingScore, setReadingScore] = useState<string>("");
  const [writingScore, setWritingScore] = useState<string>("");
  const [speakingScore, setSpeakingScore] = useState<string>("");
  const [overallScore, setOverallScore] = useState<string>("");

  // Writing task scores
  const [task1Score, setTask1Score] = useState<string>("");
  const [task2Score, setTask2Score] = useState<string>("");

  // Modified results with correct/incorrect marking
  const [modifiedResults, setModifiedResults] = useState<SectionResult[]>([]);

  // Feedback to send with email
  const [feedback, setFeedback] = useState("");

  const getResultStatus = (value: Result | null) => value?.status || "completed";

  const getNonCompletedReason = (value: Result | null) => {
    const status = getResultStatus(value);

    if (status === "completed") return null;
    if (status === "draft") {
      return "This result is still a draft from an active or recoverable attempt. Review is visible, but grading, email, and publishing are disabled until the student completes the exam.";
    }
    if (status === "abandoned") {
      return "This result belongs to an abandoned attempt. Review is visible for recovery/audit only; grading, email, and publishing are disabled.";
    }
    return `This result is not completed (${status}). Review is visible, but grading, email, and publishing are disabled.`;
  };

  useEffect(() => {
    if (resultId) {
      fetchResult();
    }
  }, [resultId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching result with ID:", resultId);
      const response = await axios.get(`/api/results/${resultId}`);
      console.log("API response:", response.data);

      if (response.data.success) {
        const resultData = response.data.result;
        if (!resultData) {
          throw new Error("Result data is missing from response");
        }

        console.log("Result data:", resultData);
        setResult(resultData);
        setModifiedResults(normalizeSectionsForReview(resultData.display_results || resultData.results || []));
        setFeedback(resultData.feedback || "");

        // Set initial scores
        setListeningScore(resultData.listening_score?.toString() || "");
        setReadingScore(resultData.reading_score?.toString() || "");
        setWritingScore(resultData.writing_score?.toString() || "");
        setSpeakingScore(resultData.speaking_score?.toString() || "");
        setOverallScore(resultData.overall_score?.toString() || "");

        // Fetch test data with correct answers
        if (resultData.test_id) {
          console.log("Fetching test data for ID:", resultData.test_id);
          const testResponse = await axios.get(
            `/api/tests/${resultData.test_id}`
          );
          if (testResponse.data.success) {
            console.log("Test data:", testResponse.data.test);
            setTest(testResponse.data.test);
          }
        }
      } else {
        throw new Error(response.data.error || "Failed to fetch result");
      }
    } catch (err: any) {
      console.error("Fetch result error:", err);
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.error || err.message || "Failed to fetch result"
      );
      notify.error("Failed to load result");
    } finally {
      setLoading(false);
    }
  };

  const calculateScoreFromAnswers = (
    sectionName: "Listening" | "Reading",
    answers: Answer[]
  ) => {
    const correctCount = answers.filter(
      (answer) => answer.isCorrect === true
    ).length;
    const scoreTable =
      sectionName === "Listening" ? LISTENING_SCORE_BANDS : READING_SCORE_BANDS;

    for (const entry of scoreTable) {
      if (correctCount >= entry.min && correctCount <= entry.max) {
        return entry.band;
      }
    }
    return 1.0;
  };

  const calculateWritingOverallScore = () => {
    const task1 = parseFloat(task1Score);
    const task2 = parseFloat(task2Score);

    if (!isNaN(task1) && !isNaN(task2)) {
      // Weighted: Task 2 = 66.6%, Task 1 = 33.3%
      const overall = task2 * 0.666 + task1 * 0.333;
      // IELTS rounding to nearest 0.5 band
      return Math.round(overall * 2) / 2;
    }
    return null;
  };

  const calculateOverallScore = () => {
    const listening = parseFloat(listeningScore);
    const reading = parseFloat(readingScore);
    const writing = parseFloat(writingScore);
    const speaking = parseFloat(speakingScore);

    if (
      !isNaN(listening) &&
      !isNaN(reading) &&
      !isNaN(writing) &&
      !isNaN(speaking)
    ) {
      const overall = (listening + reading + writing + speaking) / 4;
      return Math.round(overall * 2) / 2; // Round to nearest 0.5
    }
    return null;
  };

  const toggleAnswerCorrectness = (
    sectionIndex: number,
    sectionName: string,
    questionIndex: number
  ) => {
    const newResults = [...modifiedResults];
    const section = newResults[sectionIndex][
      sectionName as keyof SectionResult
    ] as Answer[];

    if (sectionName === "Listening" || sectionName === "Reading") {
      // For Listening/Reading, questionIndex represents the display position (0-39)
      // We need to find or create the answer for question number (questionIndex + 1)
      const questionNumber = (questionIndex + 1).toString();

      // Find existing answer for this question number
      let answerIndex = section.findIndex((answer) => {
        const questionKey = Object.keys(answer).find(
          (key) => key !== "isCorrect"
        );
        return questionKey === questionNumber;
      });

      // If answer doesn't exist, create it
      if (answerIndex === -1) {
        section.push({
          [questionNumber]: "", // Empty answer for missing questions
          isCorrect: false,
        });
        answerIndex = section.length - 1;
      }

      // Toggle: null -> true -> false -> null
      if (
        section[answerIndex].isCorrect === null ||
        section[answerIndex].isCorrect === undefined
      ) {
        section[answerIndex].isCorrect = true;
      } else if (section[answerIndex].isCorrect === true) {
        section[answerIndex].isCorrect = false;
      } else {
        section[answerIndex].isCorrect = null;
      }

      setModifiedResults(newResults);

      // Auto-calculate score for Listening/Reading
      const newScore = calculateScoreFromAnswers(sectionName, section);
      if (sectionName === "Listening") {
        setListeningScore(newScore.toString());
      } else {
        setReadingScore(newScore.toString());
      }
    } else {
      // For other sections, use original logic
      if (section && section[questionIndex]) {
        // Toggle: null -> true -> false -> null
        if (
          section[questionIndex].isCorrect === null ||
          section[questionIndex].isCorrect === undefined
        ) {
          section[questionIndex].isCorrect = true;
        } else if (section[questionIndex].isCorrect === true) {
          section[questionIndex].isCorrect = false;
        } else {
          section[questionIndex].isCorrect = null;
        }

        setModifiedResults(newResults);
      }
    }
  };

  const handleSaveResult = async () => {
    try {
      const disabledReason = getNonCompletedReason(result);
      if (disabledReason) {
        notify.error(disabledReason);
        return;
      }

      setSaving(true);

      const authUser = getAuthUser();
      if (authUser?.role !== "admin") {
        logoutAuthSession();
        notify.error("Admin session expired. Log in again.");
        return;
      }

      const updateData = {
        results: modifiedResults,
        listening_score: listeningScore ? parseFloat(listeningScore) : null,
        reading_score: readingScore ? parseFloat(readingScore) : null,
        writing_score: writingScore ? parseFloat(writingScore) : null,
        speaking_score: speakingScore ? parseFloat(speakingScore) : null,
        overall_score: overallScore ? parseFloat(overallScore) : null,
        reviewed_by: authUser.id,
        feedback,
      };

      const response = await axios.patch(
        `/api/results/${resultId}/grade`,
        updateData
      );

      if (response.data.success) {
        setResult(response.data.result);
        notify.success("Result saved successfully");
      } else {
        throw new Error("Failed to save result");
      }
    } catch (err: any) {
      console.error("Save result error:", err);
      notify.error(err.response?.data?.error || "Failed to save result");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      const disabledReason = getNonCompletedReason(result);
      if (disabledReason) {
        notify.error(disabledReason);
        return;
      }

      setSendingEmail(true);

      const response = await axios.post(`/api/results/${resultId}/send-email`);

      if (response.data.success) {
        setResult((prev) => (prev ? { ...prev, email_sent: true } : null));
        notify.success("Email sent successfully");
      } else {
        throw new Error("Failed to send email");
      }
    } catch (err: any) {
      console.error("Send email error:", err);
      notify.error(err.response?.data?.error || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePublishingAction = async (
    action:
      | "publish_scores"
      | "unpublish_scores"
      | "publish_analysis"
      | "unpublish_analysis"
  ) => {
    try {
      const disabledReason = getNonCompletedReason(result);
      if (disabledReason) {
        notify.error(disabledReason);
        return;
      }

      setUpdatingPublishing(true);
      const response = await axios.patch(`/api/results/${resultId}/publishing`, {
        action,
      });

      if (response.data.success) {
        setResult(response.data.result);
        notify.success("Publishing state updated");
        return;
      }

      throw new Error(
        response.data.error || "Failed to update publishing state"
      );
    } catch (err: any) {
      notify.error(
        err.response?.data?.error ||
          err.message ||
          "Failed to update publishing state"
      );
    } finally {
      setUpdatingPublishing(false);
    }
  };

  // Auto-update writing overall score when task scores change
  useEffect(() => {
    const overall = calculateWritingOverallScore();
    if (overall !== null) {
      setWritingScore(overall.toString());
    }
  }, [task1Score, task2Score]);

  // Auto-update overall score when section scores change
  useEffect(() => {
    const overall = calculateOverallScore();
    if (overall !== null) {
      setOverallScore(overall.toString());
    }
  }, [listeningScore, readingScore, writingScore, speakingScore]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex flex-col items-start gap-4 space-y-2">
            <Button className="w-auto" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Loading Result...</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex flex-col items-start gap-4 space-y-2">
            <Button className="w-auto" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Error</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <AppAlert tone="error" title="Result unavailable">
                {error || "Result not found"}
              </AppAlert>
              <Button onClick={() => router.back()}>Return to Results</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const nonCompletedReason = getNonCompletedReason(result);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between">
        <div className="flex items-center gap-4 my-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold">Grade Result</h1>
            <p className="text-gray-600 mt-1">
              Review and grade {result.users.full_name}'s exam
            </p>
          </div>
          <div className="space-x-2">
            <Button
              onClick={handleSaveResult}
              disabled={saving || Boolean(nonCompletedReason)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Result
            </Button>
            <Button
              onClick={handleSendEmail}
              variant={result.email_sent ? "secondary" : "default"}
              disabled={sendingEmail || Boolean(nonCompletedReason)}
            >
              {sendingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {result.email_sent ? "Send again" : "Send to Exam Taker"}
            </Button>
          </div>
        </div>
      </div>

      {nonCompletedReason ? (
        <AppAlert tone={getResultStatus(result) === "abandoned" ? "warning" : "info"} title="Result is not completed">
          {nonCompletedReason}
        </AppAlert>
      ) : null}

      <ResultPublishingControls
        result={result}
        isUpdating={updatingPublishing}
        onAction={handlePublishingAction}
        disabledReason={nonCompletedReason}
      />

      <ResultAnalysisView
        mode="admin"
        result={result}
        sections={modifiedResults}
        testCorrectAnswers={test?.correct_answers || null}
        scoreValues={{
          listening: listeningScore,
          reading: readingScore,
          writing: writingScore,
          speaking: speakingScore,
          overall: overallScore,
        }}
        onScoreChange={(key, value) => {
          if (key === "listening") setListeningScore(value);
          if (key === "reading") setReadingScore(value);
          if (key === "writing") setWritingScore(value);
          if (key === "speaking") setSpeakingScore(value);
          if (key === "overall") setOverallScore(value);
        }}
        task1Score={task1Score}
        task2Score={task2Score}
        onTask1ScoreChange={setTask1Score}
        onTask2ScoreChange={setTask2Score}
        onToggleCorrectness={toggleAnswerCorrectness}
        renderSectionTools={(sectionIndex, sectionName, answers) => {
          if (sectionName !== "Listening" && sectionName !== "Reading") {
            return null;
          }

          return (
            <div className="rounded-lg bg-gray-50 p-4">
              <AutoEvaluateAnswers
                testId={result?.test_id || ""}
                sectionName={sectionName}
                userAnswers={answers}
                correctAnswers={test?.correct_answers || null}
                onEvaluationComplete={(updatedAnswers) => {
                  const newModifiedResults = [...modifiedResults];
                  newModifiedResults[sectionIndex] = {
                    ...newModifiedResults[sectionIndex],
                    [sectionName]: updatedAnswers,
                  };
                  const sectionResults = calculateScoreFromAnswers(
                    sectionName,
                    updatedAnswers
                  );

                  if (sectionName === "Listening") {
                    setListeningScore(String(sectionResults));
                  }

                  if (sectionName === "Reading") {
                    setReadingScore(String(sectionResults));
                  }

                  setModifiedResults(newModifiedResults);
                  notify.success(
                    `${sectionName} section auto-evaluated successfully!`
                  );
                }}
              />
            </div>
          );
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Editable Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[200px] w-full"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide overall feedback for the student"
          />
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Result Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Result ID:</span>
            <span className="font-mono">{result.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Lifecycle Status:</span>
            <StatusBadge
              status={
                getResultStatus(result) === "draft"
                  ? "draft"
                  : getResultStatus(result) === "abandoned"
                    ? "abandoned"
                    : "completed"
              }
              label={getResultStatus(result)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Reviewed By:</span>
            <span>{result.reviewed_by || "Not reviewed"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Reviewed At:</span>
            <span>
              {result.reviewed_at
                ? new Date(result.reviewed_at).toLocaleString()
                : "Not reviewed"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Email Status:</span>
            <div className="flex items-center gap-2">
              {result.email_sent ? (
                <>
                  <StatusBadge status="saved" label="Sent" />
                </>
              ) : (
                <span className="text-gray-500">Not sent</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
