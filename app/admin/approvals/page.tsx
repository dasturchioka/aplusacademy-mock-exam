"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExamEntryApproval, User, ApprovalStatus } from "@/types/db";
import { CheckCircle, XCircle, Clock, RefreshCw, Users } from "lucide-react";
import { defaultInstance as axios } from "@/http/index";

interface ApprovalWithUser extends ExamEntryApproval {
  users: User;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
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
        error.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    approvalId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setActionLoading(approvalId);

      const adminSession = sessionStorage.getItem("adminSession");

      if (!adminSession) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      const adminId = JSON.parse(adminSession).id;

      const response = await axios.post("/api/users/approve-entry", {
        approval_id: approvalId,
        action: action,
        approved_by: adminId, // This should come from admin session
      });

      if (response.data.success) {
        // Refresh the approvals list
        await fetchApprovals();
      } else {
        setError(response.data.message || `Failed to ${action} user`);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error);
      setError(
        error.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = approvals.filter((a) => a.status === "pending").length;
  const approvedCount = approvals.filter((a) => a.status === "approved").length;
  const rejectedCount = approvals.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exam Entry Approvals</h1>
          <p className="text-gray-600">
            Manage user requests to enter the exam
          </p>
        </div>
        <Button onClick={fetchApprovals} disabled={loading} variant="outline">
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-2xl font-bold">{approvals.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-yellow-600 mr-2" />
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
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-2xl font-bold">{approvedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <XCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-2xl font-bold">{rejectedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Loading approvals...</span>
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No approval requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell className="font-mono font-medium">
                      {approval.user_id}
                    </TableCell>
                    <TableCell>
                      {approval.users?.full_name || "Unknown User"}
                    </TableCell>
                    <TableCell>{approval.users?.email || "No email"}</TableCell>
                    <TableCell>{getStatusBadge(approval.status)}</TableCell>
                    <TableCell>
                      {new Date(approval.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {approval.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApproval(approval.id, "approve")
                            }
                            disabled={actionLoading === approval.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === approval.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleApproval(approval.id, "reject")
                            }
                            disabled={actionLoading === approval.id}
                          >
                            {actionLoading === approval.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      )}
                      {approval.status === "approved" && (
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-green-600">
                            Approved
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleApproval(approval.id, "reject")
                            }
                            disabled={actionLoading === approval.id}
                          >
                            {actionLoading === approval.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      )}
                      {approval.status === "rejected" && (
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-red-600">Rejected</span>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApproval(approval.id, "approve")
                            }
                            disabled={actionLoading === approval.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === approval.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
