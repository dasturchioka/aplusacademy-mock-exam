'use client'

import { AnswerStorage } from './answerHandlers'
import {
	autosaveExamAttempt,
	completeExamAttempt,
	completeExamSection,
} from './examAttemptClient'
import { buildDraftStateFromBrowser } from './examDraftState'
import {
	deleteExpiredJobs,
	ExamSaveJob,
	ExamSaveOperation,
	ExamSection,
	getAllJobsForDebug,
	getPendingJobs,
	getQueueDebugSummary,
	markJobFailed,
	markJobSynced,
	upsertSectionJob,
} from './examSaveQueue'

const ATTEMPT_TTL_MS = 24 * 60 * 60 * 1000
const RETRY_BASE_DELAY_MS = 1000
const RETRY_MAX_DELAY_MS = 30000
const AUTOSAVE_IDLE_DELAY_MS = 5000
const AUTOSAVE_MAX_WAIT_MS = 30000
const SECTION_ORDER: ExamSection[] = ['Listening', 'Reading', 'Writing']
const OPERATION_ORDER: ExamSaveOperation[] = ['autosave', 'complete-section', 'complete-attempt']

type AttemptFlushState = {
	promise: Promise<void>
	rerunRequested: boolean
}

type DirtyAutosaveCallbacks = {
	onSaving?: () => void
	onSaved?: () => void
	onError?: (error: Error) => void
}

type DirtyAutosaveOptions = {
	idleDelayMs?: number
	maxWaitMs?: number
}

type DirtyAutosaveState = {
	firstDirtyAt: number
	idleTimerId?: number
	maxTimerId?: number
	idleDueAt?: number
	isDirty: boolean
	callbacks?: DirtyAutosaveCallbacks
}

type ActiveTestSession = {
	userId: string
	testId: string
	resultId?: string
	clientAttemptId?: string
	attemptId?: string
	startedAt: string
}

const activeFlushes = new Map<string, AttemptFlushState>()
const retryTimers = new Map<string, number>()
const dirtyAutosaves = new Map<ExamSection, DirtyAutosaveState>()

let runtimeHooksInitialized = false
let debugHooksInitialized = false

declare global {
	interface Window {
		__examSaveQueueDebug?: {
			getJobs: typeof getAllJobsForDebug
			getSummary: typeof getQueueDebugSummary
			flushAllPending: typeof flushAllPending
			flushAttempt: typeof flushAttempt
		}
	}
}

function assertBrowserWindow(): Window {
	if (typeof window === 'undefined') {
		throw new Error('Exam save runner requires a browser window context')
	}

	return window
}

function getRetryDelayMs(retryCount: number): number {
	return Math.min(RETRY_BASE_DELAY_MS * 2 ** Math.max(retryCount - 1, 0), RETRY_MAX_DELAY_MS)
}

function getSectionRank(section: ExamSection): number {
	return SECTION_ORDER.indexOf(section)
}

function getOperationRank(operation: ExamSaveOperation): number {
	return OPERATION_ORDER.indexOf(operation)
}

function ensureRuntimeHooks(): void {
	if (runtimeHooksInitialized || typeof window === 'undefined') {
		return
	}

	ensureDebugHooks()
	runtimeHooksInitialized = true

	window.addEventListener('online', () => {
		void flushAllPending()
	})

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			void Promise.all(SECTION_ORDER.map(section => flushDirtyAutosave(section))).catch(() => undefined)
			return
		}

		if (document.visibilityState === 'visible') {
			void flushAllPending()
		}
	})
}

function clearDirtyTimers(state: DirtyAutosaveState): void {
	if (typeof window === 'undefined') {
		return
	}

	if (state.idleTimerId) {
		window.clearTimeout(state.idleTimerId)
	}
	if (state.maxTimerId) {
		window.clearTimeout(state.maxTimerId)
	}

	state.idleTimerId = undefined
	state.maxTimerId = undefined
	state.idleDueAt = undefined
}

function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error('Autosave failed')
}

function isDebugFlagEnabled(): boolean {
	if (typeof window === 'undefined') {
		return false
	}

	try {
		return window.localStorage.getItem('examSaveDebug') === '1'
	} catch {
		return false
	}
}

function ensureDebugHooks(): void {
	if (debugHooksInitialized || typeof window === 'undefined' || !isDebugFlagEnabled()) {
		return
	}

	window.__examSaveQueueDebug = {
		getJobs: getAllJobsForDebug,
		getSummary: getQueueDebugSummary,
		flushAllPending,
		flushAttempt,
	}
	debugHooksInitialized = true
}

function scheduleRetry(attemptId: string, retryCount: number): void {
	if (typeof window === 'undefined') {
		return
	}

	const existingTimer = retryTimers.get(attemptId)
	if (existingTimer) {
		window.clearTimeout(existingTimer)
	}

	const delayMs = getRetryDelayMs(retryCount)
	const timerId = window.setTimeout(() => {
		retryTimers.delete(attemptId)
		void flushAttempt(attemptId)
	}, delayMs)

	retryTimers.set(attemptId, timerId)
}

function clearRetryTimer(attemptId: string): void {
	if (typeof window === 'undefined') {
		return
	}

	const timerId = retryTimers.get(attemptId)
	if (timerId) {
		window.clearTimeout(timerId)
		retryTimers.delete(attemptId)
	}
}

function ensureActiveSession(): Required<Pick<
	ActiveTestSession,
	'userId' | 'testId' | 'resultId' | 'clientAttemptId' | 'attemptId'
>> {
	const session = AnswerStorage.getTestSession() as ActiveTestSession | null
	const resultId = session?.resultId ?? AnswerStorage.getResultId() ?? undefined

	if (!session?.userId || !session.testId || !session.clientAttemptId || !session.attemptId || !resultId) {
		throw new Error('No active server-owned exam attempt found')
	}

	return {
		userId: session.userId,
		testId: session.testId,
		resultId,
		clientAttemptId: session.clientAttemptId,
		attemptId: session.attemptId,
	}
}

function buildJob(section: ExamSection, operation: ExamSaveOperation): ExamSaveJob {
	const session = ensureActiveSession()
	const nowIso = new Date().toISOString()

	return {
		id: `${session.attemptId}:${operation}:${section}`,
		attemptId: session.attemptId,
		clientAttemptId: session.clientAttemptId,
		userId: session.userId,
		testId: session.testId,
		resultId: session.resultId,
		section,
		operation,
		draftState: buildDraftStateFromBrowser(section),
		status: 'pending',
		retryCount: 0,
		createdAt: nowIso,
		updatedAt: nowIso,
		expiresAt: new Date(Date.now() + ATTEMPT_TTL_MS).toISOString(),
	}
}

async function dispatchJob(job: ExamSaveJob): Promise<void> {
	if (job.operation === 'autosave') {
		const response = await autosaveExamAttempt({
			attemptId: job.attemptId,
			currentSection: job.section,
			draftState: job.draftState,
		})
		if (!response?.success) throw new Error(response?.error || 'Failed to autosave exam attempt')
		return
	}

	if (job.operation === 'complete-section') {
		const response = await completeExamSection({
			attemptId: job.attemptId,
			section: job.section,
			draftState: job.draftState,
		})
		if (!response?.success) throw new Error(response?.error || `Failed to save ${job.section} section`)
		return
	}

	const response = await completeExamAttempt({
		attemptId: job.attemptId,
		draftState: job.draftState,
	})
	if (!response?.success) throw new Error(response?.error || 'Failed to complete exam attempt')
}

function sortJobs(left: ExamSaveJob, right: ExamSaveJob): number {
	const operationDelta = getOperationRank(left.operation) - getOperationRank(right.operation)
	if (operationDelta !== 0) return operationDelta
	return getSectionRank(left.section) - getSectionRank(right.section)
}

async function flushAttemptOnce(attemptId: string): Promise<void> {
	await deleteExpiredJobs()

	const jobs = (await getPendingJobs())
		.filter(job => job.attemptId === attemptId)
		.sort(sortJobs)

	if (jobs.length === 0) {
		clearRetryTimer(attemptId)
		return
	}

	for (const job of jobs) {
		const syncingJob = await upsertSectionJob({
			...job,
			status: 'syncing',
			lastError: undefined,
		})

		try {
			await dispatchJob(syncingJob)
			await markJobSynced(syncingJob.id)
			clearRetryTimer(attemptId)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to sync exam attempt'
			const failedJob = await markJobFailed(syncingJob.id, message)
			scheduleRetry(attemptId, failedJob.retryCount)
			throw new Error(message)
		}
	}
}

async function queueJob(section: ExamSection, operation: ExamSaveOperation): Promise<ExamSaveJob> {
	assertBrowserWindow()
	ensureRuntimeHooks()

	const job = buildJob(section, operation)
	return await upsertSectionJob(job)
}

export async function queueAutosave(section: ExamSection): Promise<void> {
	const job = await queueJob(section, 'autosave')
	void flushAttempt(job.attemptId)
}

export async function autosaveAndWait(section: ExamSection): Promise<void> {
	const job = await queueJob(section, 'autosave')
	await flushAttempt(job.attemptId)
}

export async function flushDirtyAutosave(section: ExamSection): Promise<void> {
	assertBrowserWindow()
	ensureRuntimeHooks()

	const state = dirtyAutosaves.get(section)
	if (!state?.isDirty) {
		return
	}

	clearDirtyTimers(state)
	state.isDirty = false

	try {
		await autosaveAndWait(section)
		if (!state.isDirty) {
			state.callbacks?.onSaved?.()
		}
	} catch (error) {
		const normalizedError = toError(error)
		state.isDirty = true
		state.callbacks?.onError?.(normalizedError)
		throw normalizedError
	} finally {
		if (!state.isDirty) {
			state.firstDirtyAt = 0
			state.callbacks = undefined
		}
	}
}

export function scheduleDirtyAutosave(
	section: ExamSection,
	callbacks?: DirtyAutosaveCallbacks,
	options?: DirtyAutosaveOptions
): void {
	const browserWindow = assertBrowserWindow()
	ensureRuntimeHooks()

	const now = Date.now()
	const idleDelayMs = Math.max(0, options?.idleDelayMs ?? AUTOSAVE_IDLE_DELAY_MS)
	const maxWaitMs = Math.max(0, options?.maxWaitMs ?? AUTOSAVE_MAX_WAIT_MS)
	const existingState = dirtyAutosaves.get(section)
	const state: DirtyAutosaveState = existingState || {
		firstDirtyAt: now,
		isDirty: false,
	}

	state.isDirty = true
	if (!state.firstDirtyAt) {
		state.firstDirtyAt = now
	}
	if (callbacks) {
		state.callbacks = callbacks
	}

	const run = () => {
		const current = dirtyAutosaves.get(section)
		if (!current?.isDirty) {
			return
		}

		current.callbacks?.onSaving?.()
		void flushDirtyAutosave(section).catch(() => undefined)
	}

	const nextIdleDueAt = now + idleDelayMs
	if (!state.idleTimerId || !state.idleDueAt || nextIdleDueAt <= state.idleDueAt) {
		if (state.idleTimerId) {
			browserWindow.clearTimeout(state.idleTimerId)
		}
		state.idleDueAt = nextIdleDueAt
		state.idleTimerId = browserWindow.setTimeout(run, idleDelayMs)
	}

	if (!state.maxTimerId) {
		const elapsed = now - state.firstDirtyAt
		state.maxTimerId = browserWindow.setTimeout(run, Math.max(maxWaitMs - elapsed, 0))
	}

	dirtyAutosaves.set(section, state)
}

export async function saveSectionAndWait(section: ExamSection): Promise<void> {
	const job = await queueJob(section, 'complete-section')
	await flushAttempt(job.attemptId)
}

export async function completeAttemptAndWait(): Promise<void> {
	const job = await queueJob('Writing', 'complete-attempt')
	await flushAttempt(job.attemptId)
}

export async function flushAttempt(attemptId: string): Promise<void> {
	assertBrowserWindow()
	ensureRuntimeHooks()

	const existingState = activeFlushes.get(attemptId)
	if (existingState) {
		existingState.rerunRequested = true
		return existingState.promise
	}

	const flushState: AttemptFlushState = {
		promise: Promise.resolve(),
		rerunRequested: false,
	}

	flushState.promise = (async () => {
		try {
			do {
				flushState.rerunRequested = false
				await flushAttemptOnce(attemptId)
			} while (flushState.rerunRequested)
		} finally {
			activeFlushes.delete(attemptId)
		}
	})()

	activeFlushes.set(attemptId, flushState)
	return flushState.promise
}

export async function flushAllPending(): Promise<void> {
	assertBrowserWindow()
	ensureRuntimeHooks()
	await deleteExpiredJobs()

	const jobs = await getPendingJobs()
	const attemptIds = Array.from(new Set(jobs.map(job => job.attemptId)))

	for (const attemptId of attemptIds) {
		await flushAttempt(attemptId)
	}
}

ensureDebugHooks()
