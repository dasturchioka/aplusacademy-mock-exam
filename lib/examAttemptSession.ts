'use client'

import { AnswerStorage, clearVisibleExamState } from './answerHandlers'
import {
	buildDraftStateFromBrowser,
	hydrateBrowserFromDraftState,
	mergeDraftState,
	type ExamSection,
} from './examDraftState'
import { startExamAttempt } from './examAttemptClient'

export type ExamSectionName = 'Listening' | 'Reading' | 'Writing'

export async function prepareServerExamAttempt(userId: string) {
	const response = await startExamAttempt()

	if (!response.success || !response.attempt || !response.test) {
		throw new Error(response.error || 'Failed to start exam attempt')
	}

	const { attempt, test } = response
	const existingSession = AnswerStorage.getTestSession()
	const isSameBrowserAttempt =
		existingSession?.userId === userId &&
		existingSession.testId === test.id &&
		existingSession.attemptId === attempt.id
	const serverDraftState = mergeDraftState(attempt.draft_state)
	const currentSection = attempt.current_section as ExamSection
	const draftState = isSameBrowserAttempt
		? buildDraftStateFromBrowser(currentSection, serverDraftState)
		: serverDraftState

	if (!isSameBrowserAttempt) {
		clearVisibleExamState()
	}

	AnswerStorage.setTestSession(userId, test.id, attempt.client_attempt_id, attempt.id)
	AnswerStorage.setResultId(attempt.result_id)
	hydrateBrowserFromDraftState(draftState)

	return { attempt, test, draftState }
}

export function sectionPath(section: string): string {
	return `/exam/${section.toLowerCase()}`
}

export function getNextSectionPath(section: ExamSectionName): string | null {
	if (section === 'Listening') return '/exam/reading'
	if (section === 'Reading') return '/exam/writing'
	return '/exam/complete'
}
