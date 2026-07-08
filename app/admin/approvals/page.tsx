"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingButton } from "@/components/ui/loading-button";
import { PageState } from "@/components/ui/page-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultInstance as axios } from "@/http/index";
import { getAuthUser, logoutAuthSession } from "@/lib/authClient";
import { applyExamEntryApprovalAction } from "@/lib/examEntryApprovalsClient";
import { ApprovalStatus, ExamEntryApproval, Test, User } from "@/types/db";
import { Archive, CheckCircle, Clock, RefreshCw, RotateCcw } from "lucide-react";

type ApprovalActionType =
  | "approve_pending"
  | "reject_pending"
  | "reject_approved";
type ApprovalFilter = "active" | "history" | "all";

interface ApprovalWithUser extends ExamEntryApproval {
  users?: Pick<User, "full_name" | "email"> | null;
  tests?: Pick<Test, "title" | "edition" | "test_number"> | null;
}

const CONFIRM_PREFIX = "aplus.approvals.skipConfirm.";

function shouldSkipConfirm(type: ApprovalActionType) {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${CONFIRM_PREFIX}${type}`) === "true";
}

function setSkipConfirm(type: ApprovalActionType, value: boolean) {
  if (typeof window === "undefined" || !value) return;
  localStorage.setItem(`${CONFIRM_PREFIX}${type}`, "true");
}

function getStudentName(approval: ApprovalWithUser) {
  return approval.users?.full_name || approval.user_id;
}

function getTestTitle(approval: ApprovalWithUser) {
  if (!approval.tests) return "Unknown test";
  return [
    approval.tests.title,
    approval.tests.edition,
    approval.tests.test_number ? `#${approval.tests.test_number}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getStatusBadge(status: ApprovalStatus) {
  if (status === "pending") return <StatusBadge status="pending" />;
  if (status === "approved") return <StatusBadge status="approved" />;
  if (status === "rejected") return <StatusBadge status="rejected" />;
  if (status === "consumed") return <StatusBadge status="neutral" label="Consumed" />;
  if (status === "stale") return <StatusBadge status="neutral" label="Stale" />;
  return <StatusBadge status="neutral" label={status} />;
}

function getDialogContent(pendingAction: {
  approval: ApprovalWithUser;
  action: "approve" | "reject";
  type: ApprovalActionType;
}) {
  const studentName = getStudentName(pendingAction.approval);
  const testTitle = getTestTitle(pendingAction.approval);

  if (pendingAction.type === "approve_pending") {
    return {
      title: "Approve exam access?",
      body: `${studentName} will be allowed to start ${testTitle}. One approval creates one attempt.`,
      confirm: "Approve",
      checkbox: "Do not show this confirmation again",
    };
  }

  if (pendingAction.type === "reject_approved") {
    return {
      title: "Revoke approved access?",
      body: `${studentName} is already approved for ${testTitle}. This is allowed only because no attempt has started.`,
      confirm: "Revoke approval",
      checkbox:
        "Do not show this confirmation again for approved-access revokes",
    };
  }

  return {
    title: "Reject request?",
    body: `${studentName} will not be able to start ${testTitle} unless they request again.`,
    confirm: "Reject",
    checkbox: "Do not show this confirmation again",
  };
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<ApprovalFilter>("active");
  const [skipNext, setSkipNext] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    approval: ApprovalWithUser;
    action: "approve" | "reject";
    type: ApprovalActionType;
  } | null>(null);

  useEffect(() => {
    void fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("/api/approvals");

      if (response.data.success) {
        setApprovals(response.data.approvals || []);
      } else {
        setError(response.data.message || "Failed to fetch approvals");
      }
    } catch (error: any) {
      console.error("Error fetching approvals:", error);
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredApprovals = useMemo(() => {
    if (filter === "active") {
      return approvals.filter(
        (approval) =>
          approval.status === "pending" || approval.status === "approved"
      );
    }

    if (filter === "history") {
      return approvals.filter(
        (approval) =>
          approval.status === "consumed" ||
          approval.status === "rejected" ||
          approval.status === "stale"
      );
    }

    return approvals;
  }, [approvals, filter]);

  const pendingCount = approvals.filter((a) => a.status === "pending").length;
  const approvedCount = approvals.filter((a) => a.status === "approved").length;
  const consumedCount = approvals.filter((a) => a.status === "consumed").length;
  const staleCount = approvals.filter((a) => a.status === "stale").length;

  const handleApproval = async (
    approvalId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setActionLoading(approvalId);
      setError("");

      const authUser = getAuthUser();
      if (authUser?.role !== "admin") {
        logoutAuthSession();
        window.location.href = "/auth/admin";
        return;
      }

      await applyExamEntryApprovalAction({
        approvalId,
        action,
      });

      await fetchApprovals();
    } catch (error: any) {
      console.error(`Error ${action}ing approval:`, error);
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Network error. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const requestAction = (
    approval: ApprovalWithUser,
    action: "approve" | "reject"
  ) => {
    const type: ApprovalActionType =
      action === "approve"
        ? "approve_pending"
        : approval.status === "approved"
          ? "reject_approved"
          : "reject_pending";

    if (shouldSkipConfirm(type)) {
      void handleApproval(approval.id, action);
      return;
    }

    setPendingAction({ approval, action, type });
    setSkipNext(false);
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;

    setSkipConfirm(pendingAction.type, skipNext);
    await handleApproval(pendingAction.approval.id, pendingAction.action);
    setPendingAction(null);
  };

  const dialogContent = pendingAction
    ? getDialogContent(pendingAction)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Exam Entry Approvals</h1>
          <p className="text-gray-600">
            Manage exact-test access requests for student exam attempts
          </p>
        </div>
        <Button onClick={fetchApprovals} disabled={loading} variant="outline">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{approvedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Consumed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Archive className="mr-2 h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{consumedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Stale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <RotateCcw className="mr-2 h-4 w-4 text-gray-600" />
              <span className="text-2xl font-bold">{staleCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Approval Requests</CardTitle>
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as ApprovalFilter)}
            >
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageState type="loading" title="Loading approvals" />
          ) : filteredApprovals.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No approval requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApprovals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell className="font-mono font-medium">
                      {approval.user_id}
                    </TableCell>
                    <TableCell>
                      {approval.users?.full_name || "Unknown User"}
                    </TableCell>
                    <TableCell>{approval.users?.email || "No email"}</TableCell>
                    <TableCell className="max-w-[260px]">
                      <span className="line-clamp-2">
                        {getTestTitle(approval)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {approval.test_source || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(approval.status)}</TableCell>
                    <TableCell>
                      {new Date(approval.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {approval.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <LoadingButton
                            size="sm"
                            loading={actionLoading === approval.id}
                            loadingText="Approving..."
                            onClick={() => requestAction(approval, "approve")}
                            className="min-w-[96px]"
                          >
                            Approve
                          </LoadingButton>
                          <LoadingButton
                            size="sm"
                            variant="destructive"
                            loading={actionLoading === approval.id}
                            loadingText="Rejecting..."
                            onClick={() => requestAction(approval, "reject")}
                            className="min-w-[96px]"
                          >
                            Reject
                          </LoadingButton>
                        </div>
                      )}
                      {approval.status === "approved" && !approval.attempt_id && (
                        <LoadingButton
                          size="sm"
                          variant="destructive"
                          loading={actionLoading === approval.id}
                          loadingText="Revoking..."
                          onClick={() => requestAction(approval, "reject")}
                          className="min-w-[96px]"
                        >
                          Revoke
                        </LoadingButton>
                      )}
                      {(approval.status === "consumed" ||
                        approval.status === "rejected" ||
                        approval.status === "stale" ||
                        (approval.status === "approved" && approval.attempt_id)) && (
                        <span className="text-sm text-gray-500">Read-only</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent?.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={skipNext}
              onCheckedChange={(checked) => setSkipNext(checked === true)}
            />
            {dialogContent?.checkbox}
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionLoading}>
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={confirmPendingAction}
              disabled={!!actionLoading}
              variant={pendingAction?.action === "reject" ? "destructive" : "default"}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Working...
                </>
              ) : (
                dialogContent?.confirm
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
