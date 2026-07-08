'use client'

import defaultInstance from '@/http'
import type { ApprovalRequestResponse } from '@/types/db'

export async function requestExamEntryApproval(_studentId?: string) {
  const response = await defaultInstance.post<ApprovalRequestResponse>('/api/exam-entry-approvals/request')
  return response.data
}

export async function applyExamEntryApprovalAction(params: {
  approvalId: string
  action: 'approve' | 'reject'
  adminId?: string
}) {
  const response = await defaultInstance.post(
    `/api/exam-entry-approvals/${params.approvalId}/action`,
    {
      action: params.action,
    }
  )
  return response.data
}
