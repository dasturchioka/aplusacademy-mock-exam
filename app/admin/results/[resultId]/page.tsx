"use client";

import AutoEvaluateAnswers from "@/components/admin/AutoEvaluateAnswers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultInstance as axios } from "@/http";
import {
  CorrectAnswersStructure,
  getCorrectAnswerForDisplay,
} from "@/lib/answerEvaluation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Hash,
  Loader2,
  Mail,
  Save,
  Send,
  User,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import WritingTaskAIEvaluation from "@/components/admin/WritingTaskAIEvaluation";

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

interface Answer {
  [questionNumber: string]: string | boolean | null | undefined;
  isCorrect?: boolean | null;
}

interface QuestionData {
  questionNumber: number;
  answer: Answer;
  hasUserAnswer: boolean;
}

interface SectionResult {
  Listening?: Answer[];
  Reading?: Answer[];
  Writing?: Array<{ report?: string; essay?: string }>;
}

interface Result {
  id: string;
  exam_taker_id: string;
  test_id: string;
  taken_date: string;
  results: SectionResult[];
  listening_score: number | null;
  reading_score: number | null;
  writing_score: number | null;
  speaking_score: number | null;
  overall_score: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  email_sent: boolean;
  created_at: string;
  users: User;
  tests: Test;
  feedback?: string;
}

// IELTS Band Score Conversion Tables
export const LISTENING_SCORE_BANDS = [
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

export const READING_SCORE_BANDS = [
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
              <p className="text-red-600 mb-4">Result ID is missing</p>
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
        setModifiedResults(resultData.results || []);

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
      toast.error("Failed to load result");
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
      setSaving(true);

      const adminSession = sessionStorage.getItem("adminSession");

      if (!adminSession) {
        toast.error("Admin session not found, close and open the tab again");
        return;
      }

      const parsedSession = JSON.parse(adminSession);

      if (!parsedSession || !parsedSession.id) {
        toast.error("Admin session not found, close and open the tab again");
        return;
      }

      const updateData = {
        results: modifiedResults,
        listening_score: listeningScore ? parseFloat(listeningScore) : null,
        reading_score: readingScore ? parseFloat(readingScore) : null,
        writing_score: writingScore ? parseFloat(writingScore) : null,
        speaking_score: speakingScore ? parseFloat(speakingScore) : null,
        overall_score: overallScore ? parseFloat(overallScore) : null,
        reviewed_by: parsedSession.id, // You might want to get this from auth context
        feedback,
      };

      const response = await axios.patch(
        `/api/results/${resultId}/grade`,
        updateData
      );

      if (response.data.success) {
        setResult(response.data.result);
        toast.success("Result saved successfully");
      } else {
        throw new Error("Failed to save result");
      }
    } catch (err: any) {
      console.error("Save result error:", err);
      toast.error(err.response?.data?.error || "Failed to save result");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);

      const response = await axios.post(`/api/results/${resultId}/send-email`);

      if (response.data.success) {
        setResult((prev) => (prev ? { ...prev, email_sent: true } : null));
        toast.success("Email sent successfully");
      } else {
        throw new Error("Failed to send email");
      }
    } catch (err: any) {
      console.error("Send email error:", err);
      toast.error(err.response?.data?.error || "Failed to send email");
    } finally {
      setSendingEmail(false);
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

  const wordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <Button variant="outline" onClick={() => router.back()}>
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
          <div className="flex flex-col gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Error</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error || "Result not found"}</p>
              <Button onClick={() => router.back()}>Return to Results</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between">
        <div className="flex items-center gap-4">
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
              disabled={saving}
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

      {/* Exam Taker Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Exam Taker Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Full Name</p>
            <p className="text-lg font-semibold">{result.users.full_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Email</p>
            <p className="text-lg">{result.users.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Exam Taker ID</p>
            <p className="text-lg font-mono">{result.exam_taker_id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Test Date</p>
            <p className="text-lg">
              {new Date(result.taken_date).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Test Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Test Title</p>
            <p className="text-lg font-semibold">{result.tests.title}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Edition</p>
            <p className="text-lg">{result.tests.edition || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Test ID</p>
            <p className="text-lg font-mono">{result.test_id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Overall Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Listening Score
              </label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="9"
                value={listeningScore}
                onChange={(e) => setListeningScore(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Reading Score
              </label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="9"
                value={readingScore}
                onChange={(e) => setReadingScore(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Writing Score
              </label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="9"
                value={writingScore}
                onChange={(e) => setWritingScore(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Speaking Score
              </label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="9"
                value={speakingScore}
                onChange={(e) => setSpeakingScore(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Overall Score
              </label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="9"
                value={overallScore}
                onChange={(e) => setOverallScore(e.target.value)}
                placeholder="0.0"
                className="font-bold text-blue-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {result.feedback && (
            <div className="mb-4">
              <p className="font-bold">Current feedback</p>
              <p className="italic">"{result.feedback}"</p>
            </div>
          )}
          <div className="flex flex-col items-start gap-4">
            <div>
              <p>Provide your overall feedback for the student: </p>
            </div>
            <Textarea
              className="w-full min-h-[200px]"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Cheer him/her up..."
            ></Textarea>
          </div>
        </CardContent>
      </Card>
      {/* Section Details */}
      {modifiedResults.map((sectionResult, sectionIndex) => {
        const sectionName = Object.keys(sectionResult)[0];
        const answers = sectionResult[sectionName as keyof SectionResult];

        if (sectionName === "Writing" && Array.isArray(answers)) {
          const writingAnswers = answers as Array<{
            report?: string;
            essay?: string;
          }>;
          const essayText =
            writingAnswers.find((t) => t.essay !== undefined)?.essay || "";
          return (
            <Card key={sectionIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ✍️ Writing Section
                  <Badge variant="secondary">2 Tasks</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {writingAnswers.map((task, taskIndex) => (
                  <div key={taskIndex}>
                    {task.report !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Task 1 - Report</h4>
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Task 1 Score:</label>
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              max="9"
                              value={task1Score}
                              onChange={(e) => setTask1Score(e.target.value)}
                              className="w-20"
                            />
                          </div>
                        </div>
                        <Textarea
                          value={task.report || ""}
                          readOnly
                          className="min-h-[150px] bg-gray-50"
                          placeholder="No answer provided"
                        />
                        <p className="mt-4">{wordCount(task.report)} words</p>
                      </div>
                    )}
                    {task.essay !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Task 2 - Essay</h4>
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Task 2 Score:</label>
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              max="9"
                              value={task2Score}
                              onChange={(e) => setTask2Score(e.target.value)}
                              className="w-20"
                            />
                          </div>
                        </div>
                        <Textarea
                          value={task.essay || ""}
                          readOnly
                          className="min-h-[200px] bg-gray-50"
                          placeholder="No answer provided"
                        />
                        <p className="mt-4">{wordCount(task.essay)} words</p>
                      </div>
                    )}
                  </div>
                ))}
                {/* AI Auto Evaluation for Writing: Task 1 first, then Task 2 */}
                {/* <WritingTaskAIEvaluation
                  label="Task 1 - Report AI Evaluation"
                  taskType="task1"
                  text={
                    writingAnswers.find((t) => t.report !== undefined)
                      ?.report || ""
                  }
                  onScore={(band) => {
                    setTask1Score(String(band));
                  }}
                  onBothDone={(t1, t2) => {
                    // if task2 already exists in state, compute writing with 33.3/66.6
                    const t2Num = parseFloat(t2 || task2Score || "0") || 0;
                    const t1Num = parseFloat(t1 || "0") || 0;
                    const combined = t1Num * (1 / 3) + t2Num * (2 / 3);
                    setWritingScore(String(Math.round(combined * 2) / 2));
                  }}
                />
                <WritingTaskAIEvaluation
                  label="Task 2 - Essay AI Evaluation"
                  taskType="task2"
                  text={essayText}
                  onScore={(band) => {
                    setTask2Score(String(band));
                  }}
                  onBothDone={(t1, t2) => {
                    const t1Num = parseFloat(t1 || task1Score || "0") || 0;
                    const t2Num = parseFloat(t2 || "0") || 0;
                    const combined = t1Num * (1 / 3) + t2Num * (2 / 3);
                    setWritingScore(String(Math.round(combined * 2) / 2));
                  }}
                /> */}
              </CardContent>
            </Card>
          );
        }

        if (sectionName === "Speaking") {
          return (
            <Card key={sectionIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎤 Speaking Section
                  <Badge variant="secondary">Manual Scoring</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Speaking section requires manual scoring by the examiner.
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Speaking Score:</label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9"
                    value={speakingScore}
                    onChange={(e) => setSpeakingScore(e.target.value)}
                    className="w-24"
                    placeholder="0.0"
                  />
                </div>
              </CardContent>
            </Card>
          );
        }

        if (Array.isArray(answers)) {
          const answerArray = answers as Answer[];

          // For Listening and Reading, always show 40 questions
          const totalQuestions =
            sectionName === "Listening" || sectionName === "Reading"
              ? 40
              : answerArray.length;

          // Create a full array of 40 questions for Listening/Reading
          const fullQuestionArray: QuestionData[] = [];
          if (sectionName === "Listening" || sectionName === "Reading") {
            for (let i = 1; i <= 40; i++) {
              // Find if user has an answer for this question number
              const existingAnswer = answerArray.find((answer) => {
                const questionKey = Object.keys(answer).find(
                  (key) => key !== "isCorrect"
                );
                return questionKey === i.toString();
              });

              if (existingAnswer) {
                // User has an answer for this question
                fullQuestionArray.push({
                  questionNumber: i,
                  answer: existingAnswer,
                  hasUserAnswer: true,
                });
              } else {
                // User missing answer for this question - create placeholder
                fullQuestionArray.push({
                  questionNumber: i,
                  answer: { [i.toString()]: "", isCorrect: false },
                  hasUserAnswer: false,
                });
              }
            }
          } else {
            // For other sections, use existing logic
            fullQuestionArray.push(
              ...answerArray.map((answer, index) => ({
                questionNumber: index + 1,
                answer: answer,
                hasUserAnswer: true,
              }))
            );
          }

          const correctCount = fullQuestionArray.filter(
            (q) => q.answer.isCorrect === true
          ).length;

          return (
            <Card key={sectionIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {sectionName === "Listening" ? "🎧" : "📖"} {sectionName}{" "}
                  Section
                  <Badge variant="secondary">{totalQuestions} Questions</Badge>
                  <Badge
                    variant={
                      correctCount === totalQuestions ? "default" : "outline"
                    }
                  >
                    {correctCount}/{totalQuestions} Correct
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Auto-Evaluation Component */}
                {(sectionName === "Listening" || sectionName === "Reading") && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <AutoEvaluateAnswers
                      testId={result?.test_id || ""}
                      sectionName={sectionName}
                      userAnswers={answerArray}
                      correctAnswers={test?.correct_answers || null}
                      onEvaluationComplete={(updatedAnswers) => {
                        // Update the modified results with evaluation results
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
                        toast.success(
                          `${sectionName} section auto-evaluated successfully!`
                        );
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {fullQuestionArray.map((questionData, questionIndex) => {
                    const { questionNumber, answer, hasUserAnswer } =
                      questionData;
                    const questionKey = Object.keys(answer).find(
                      (key) => key !== "isCorrect"
                    );
                    const rawAnswer = questionKey ? answer[questionKey] : "";
                    const userAnswer =
                      typeof rawAnswer === "string"
                        ? rawAnswer
                        : String(rawAnswer || "");

                    return (
                      <div key={questionIndex} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Question {questionNumber}
                          </label>
                          <button
                            onClick={() =>
                              toggleAnswerCorrectness(
                                sectionIndex,
                                sectionName,
                                questionIndex
                              )
                            }
                            className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-colors ${
                              answer.isCorrect === true
                                ? "bg-green-600 border-green-600 text-white"
                                : answer.isCorrect === false
                                ? "bg-red-600 border-red-600 text-white"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {answer.isCorrect === true && (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            {answer.isCorrect === false && (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {hasUserAnswer &&
                        userAnswer &&
                        userAnswer.trim() !== "" ? (
                          <>
                            <Input
                              value={userAnswer}
                              readOnly
                              className={`${
                                answer.isCorrect === true
                                  ? "bg-green-50 border-green-200"
                                  : answer.isCorrect === false
                                  ? "bg-red-50 border-red-200"
                                  : "bg-gray-50"
                              }`}
                            />
                            {/* Correct Answer Display */}
                            {test?.correct_answers && (
                              <div className="text-xs text-gray-500 italic mt-1">
                                Correct answer:{" "}
                                {getCorrectAnswerForDisplay(
                                  questionNumber,
                                  test.correct_answers,
                                  sectionName
                                ) || "Not available"}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="px-3 py-2 text-sm bg-red-100 border border-red-200 rounded text-red-800 font-bold">
                              N/A
                            </div>
                            {/* Correct Answer Display for N/A */}
                            {test?.correct_answers && (
                              <div className="text-xs text-gray-500 italic mt-1">
                                Correct answer:{" "}
                                {getCorrectAnswerForDisplay(
                                  questionNumber,
                                  test.correct_answers,
                                  sectionName
                                ) || "Not available"}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        }

        return null;
      })}

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
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Sent</span>
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
