'use client'

import defaultInstance from '@/http'
import { ExamAttempt, Test } from '@/types/db'
import { ExamDraftState } from './examDraftState'

export type StartExamAttemptResponse = {
  success: boolean
  attempt: ExamAttempt
  test: Test
  source: 'assigned' | 'global'
  error?: string
}

export async function startExamAttempt(): Promise<StartExamAttemptResponse> {
  const response = await defaultInstance.post<StartExamAttemptResponse>('/api/exam-attempts/start')
  return response.data
}

export async function autosaveExamAttempt(params: {
  attemptId: string
  currentSection: 'Listening' | 'Reading' | 'Writing'
  draftState: ExamDraftState
}) {
  const response = await defaultInstance.put(`/api/exam-attempts/${params.attemptId}/autosave`, {
    current_section: params.currentSection,
    draft_state: params.draftState,
  })
  return response.data
}

export async function completeExamSection(params: {
  attemptId: string
  section: 'Listening' | 'Reading' | 'Writing'
  draftState: ExamDraftState
}) {
  const response = await defaultInstance.post(
    `/api/exam-attempts/${params.attemptId}/sections/${params.section}/complete`,
    {
      draft_state: params.draftState,
    }
  )
  return response.data
}

export async function completeExamAttempt(params: {
  attemptId: string
  draftState: ExamDraftState
}) {
  const response = await defaultInstance.post(`/api/exam-attempts/${params.attemptId}/complete`, {
    draft_state: params.draftState,
  })
  return response.data
}

export async function abandonExamAttempt(attemptId: string) {
  const response = await defaultInstance.post(`/api/exam-attempts/${attemptId}/abandon`)
  return response.data
}
