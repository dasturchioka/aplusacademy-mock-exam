"use client";

import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { PageState, RetryAction } from "@/components/ui/page-state";
import { StatusBadge } from "@/components/ui/status-badge";
import defaultInstance from "@/http";
import { notify } from "@/lib/app-toast";
import { changePassword, getAuthUser } from "@/lib/authClient";
import { startExamAttempt } from "@/lib/examAttemptClient";
import { requestExamEntryApproval } from "@/lib/examEntryApprovalsClient";
import {
  Clock,
  FileText,
  LockKeyhole,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DashboardData = {
  success: boolean;
  user: { id: string; full_name: string; email: string; role: "student" };
  currentExam: null | {
    source: "assigned" | "global";
    test: { id: string; title: string; edition?: string; test_number?: number };
    approval: null | { id: string; status: string };
    activeAttempt: null | {
      id: string;
      current_section: "Listening" | "Reading" | "Writing";
    };
  };
  recentResults: Array<{
    id: string;
    taken_date: string;
    overall_score: number | null;
    status: string;
    published_at: string | null;
    is_published: boolean;
    is_analysis_published: boolean;
    analysis_published_at: string | null;
    tests?: { title?: string; edition?: string; test_number?: number } | null;
  }>;
};

export default function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const router = useRouter();
  const authUser = getAuthUser();

  async function loadDashboard(options: { showSkeleton?: boolean } = {}) {
    const showSkeleton = options.showSkeleton ?? !data;

    try {
      setError("");
      if (showSkeleton) {
        setIsLoading(true);
      }
      const response = await defaultInstance.get<DashboardData>(
        "/api/student/dashboard",
      );
      setData(response.data);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Could not load dashboard.",
      );
    } finally {
      if (showSkeleton) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadDashboard({ showSkeleton: true });
  }, []);

  const approvalStatus = data?.currentExam?.approval?.status || "not_requested";
  const statusBadge = useMemo(() => {
    if (data?.currentExam?.activeAttempt)
      return <StatusBadge status="active" />;
    if (approvalStatus === "approved") return <StatusBadge status="approved" />;
    if (approvalStatus === "pending") return <StatusBadge status="pending" />;
    if (approvalStatus === "rejected") return <StatusBadge status="rejected" />;
    return <StatusBadge status="neutral" label="Not requested" />;
  }, [approvalStatus, data?.currentExam?.activeAttempt]);

  async function handleRequestApproval() {
    try {
      setIsRequesting(true);
      const response = await requestExamEntryApproval();
      setData((current) => {
        if (!current?.currentExam) return current;

        return {
          ...current,
          currentExam: {
            ...current.currentExam,
            approval: response.approval
              ? {
                  id: response.approval.id,
                  status: response.approval.status,
                }
              : {
                  id: response.approvalId,
                  status: response.status,
                },
          },
        };
      });
      notify.success("Approval request sent");
      await loadDashboard({ showSkeleton: false });
    } catch (error: any) {
      notify.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Could not request approval",
      );
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleStartOrContinue() {
    if (data?.currentExam?.activeAttempt) {
      router.push(
        `/exam/${data.currentExam.activeAttempt.current_section.toLowerCase()}`,
      );
      return;
    }

    try {
      setIsStarting(true);
      const response = await startExamAttempt();
      router.push(`/exam/${response.attempt.current_section.toLowerCase()}`);
    } catch (error: any) {
      notify.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Could not start exam",
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function handlePasswordChange(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) {
      notify.error("New password must be at least 8 characters");
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      notify.success("Password changed");
    } catch (error: any) {
      notify.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Could not change password",
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoading) {
    return <PageState type="loading" title="Loading dashboard" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold">
            Welcome, {data?.user.full_name || authUser?.full_name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Student ID: {data?.user.id || authUser?.id}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void loadDashboard({ showSkeleton: true })}
        >
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <PageState
          type="error"
          title="Dashboard unavailable"
          description={error}
          action={<RetryAction onRetry={() => void loadDashboard()} />}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Current exam</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Request approval, start, or continue your active attempt.
              </p>
            </div>
            {statusBadge}
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.currentExam ? (
              <>
                <div className="rounded-md border bg-muted/40 p-4">
                  <p className="font-medium">{data.currentExam.test.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Source:{" "}
                    {data.currentExam.source === "assigned"
                      ? "Assigned exam"
                      : "Global active exam"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {approvalStatus !== "approved" &&
                    !data.currentExam.activeAttempt && (
                      <LoadingButton
                        onClick={handleRequestApproval}
                        loading={isRequesting}
                        loadingText="Requesting..."
                        disabled={approvalStatus === "pending"}
                        icon={Clock}
                      >
                        {approvalStatus === "pending"
                          ? "Approval pending"
                          : "Request approval"}
                      </LoadingButton>
                    )}

                  {(approvalStatus === "approved" ||
                    data.currentExam.activeAttempt) && (
                    <LoadingButton
                      onClick={handleStartOrContinue}
                      loading={isStarting}
                      loadingText="Preparing exam..."
                      icon={PlayCircle}
                    >
                      {data.currentExam.activeAttempt
                        ? "Continue exam"
                        : "Start exam"}
                    </LoadingButton>
                  )}
                </div>
              </>
            ) : (
              <AppAlert tone="info" title="No exam available">
                Ask staff to assign an exam or set an active exam.
              </AppAlert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <LoadingButton
                type="submit"
                variant="outline"
                className="w-full"
                loading={isChangingPassword}
                loadingText="Changing password..."
                disabled={!currentPassword || !newPassword}
                icon={LockKeyhole}
              >
                Change password
              </LoadingButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent results</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentResults.length ? (
            <div className="divide-y rounded-md border">
              {data.recentResults.map((result) => (
                <div
                  key={result.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {result.tests?.title || "Mock exam"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.taken_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      status={
                        result.status === "completed"
                          ? "completed"
                          : result.status || "neutral"
                      }
                    />
                    <StatusBadge
                      status={result.is_published ? "published" : "unpublished"}
                    />
                    <StatusBadge
                      status={
                        result.is_analysis_published
                          ? "analysis-published"
                          : "neutral"
                      }
                      label={
                        result.is_analysis_published
                          ? "Analysis"
                          : "Scores only"
                      }
                    />
                    <span className="text-sm font-medium">
                      Overall: {result.overall_score ?? "Pending"}
                    </span>
                    {result.is_published && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/student/results/${result.id}`)
                        }
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              <FileText className="size-4" />
              Completed results will appear here after grading.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
