import type { ExamDraftState } from "./examDraftState"

export type ExamSection = "Listening" | "Reading" | "Writing"
export type ExamSaveOperation = "autosave" | "complete-section" | "complete-attempt"

export type ExamSaveJob = {
  id: string
  attemptId: string
  clientAttemptId: string
  userId: string
  testId: string
  resultId?: string
  section: ExamSection
  operation: ExamSaveOperation
  draftState: ExamDraftState
  status: "pending" | "syncing" | "failed" | "synced"
  retryCount: number
  lastError?: string
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export type ExamSaveQueueDebugJob = {
  id: string
  attemptId: string
  clientAttemptId: string
  userId: string
  testId: string
  resultId?: string
  section: ExamSection
  status: ExamSaveJob["status"]
  retryCount: number
  lastError?: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  isExpired: boolean
}

export type ExamSaveQueueDebugSummary = {
  total: number
  pending: number
  syncing: number
  failed: number
  synced: number
  expired: number
  attempts: Array<{
    clientAttemptId: string
    attemptId: string
    userId: string
    testId: string
    resultId?: string
    sections: ExamSection[]
    statuses: ExamSaveJob["status"][]
    maxRetryCount: number
    lastUpdatedAt: string
  }>
}

const DB_NAME = "aplus-exam-save-queue"
const STORE_NAME = "jobs"
const DB_VERSION = 1

function assertIndexedDbAvailable(): IDBFactory {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    throw new Error("IndexedDB is unavailable: exam save queue requires a browser window context.")
  }

  return window.indexedDB
}

function isExpired(job: Pick<ExamSaveJob, "expiresAt">, now = Date.now()): boolean {
  const expiresAt = new Date(job.expiresAt).getTime()
  return !Number.isFinite(expiresAt) || expiresAt <= now
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"))
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"))
  })
}

async function openDatabase(): Promise<IDBDatabase> {
  const indexedDB = assertIndexedDbAvailable()

  return await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Failed to open exam save queue database"))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore, transaction: IDBTransaction) => Promise<T>
): Promise<T> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const result = await callback(store, transaction)
    await transactionDone(transaction)
    return result
  } finally {
    database.close()
  }
}

export async function upsertSectionJob(job: ExamSaveJob): Promise<ExamSaveJob> {
  return await withStore("readwrite", async store => {
    const existing = await requestToPromise(store.get(job.id) as IDBRequest<ExamSaveJob | undefined>)
    const nowIso = new Date().toISOString()

    const nextJob: ExamSaveJob = {
      ...job,
      createdAt: existing?.createdAt ?? job.createdAt,
      updatedAt: nowIso,
    }

    await requestToPromise(store.put(nextJob))
    return nextJob
  })
}

export async function getPendingJobs(): Promise<ExamSaveJob[]> {
  return await withStore("readonly", async store => {
    const jobs = (await requestToPromise(store.getAll())) as ExamSaveJob[]
    const now = Date.now()
    const pendingJobs: ExamSaveJob[] = []

    for (const job of jobs) {
      if (isExpired(job, now)) {
        continue
      }

      if (job.status !== "pending" && job.status !== "syncing" && job.status !== "failed") {
        continue
      }

      pendingJobs.push(job)
    }

    return pendingJobs.sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  })
}

export async function getAllJobsForDebug(): Promise<ExamSaveQueueDebugJob[]> {
  return await withStore("readonly", async store => {
    const jobs = (await requestToPromise(store.getAll())) as ExamSaveJob[]
    const now = Date.now()

    return jobs
      .map(job => ({
        id: job.id,
        attemptId: job.attemptId,
        clientAttemptId: job.clientAttemptId,
        userId: job.userId,
        testId: job.testId,
        resultId: job.resultId,
        section: job.section,
        status: job.status,
        retryCount: job.retryCount,
        lastError: job.lastError,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        expiresAt: job.expiresAt,
        isExpired: isExpired(job, now),
      }))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  })
}

export async function getQueueDebugSummary(): Promise<ExamSaveQueueDebugSummary> {
  const jobs = await getAllJobsForDebug()
  const attempts = new Map<string, ExamSaveQueueDebugSummary["attempts"][number]>()

  for (const job of jobs) {
    const existing = attempts.get(job.clientAttemptId)

    if (!existing) {
      attempts.set(job.clientAttemptId, {
        clientAttemptId: job.clientAttemptId,
        attemptId: job.attemptId,
        userId: job.userId,
        testId: job.testId,
        resultId: job.resultId,
        sections: [job.section],
        statuses: [job.status],
        maxRetryCount: job.retryCount,
        lastUpdatedAt: job.updatedAt,
      })
      continue
    }

    if (job.resultId && !existing.resultId) {
      existing.resultId = job.resultId
    }

    if (!existing.sections.includes(job.section)) {
      existing.sections.push(job.section)
    }

    if (!existing.statuses.includes(job.status)) {
      existing.statuses.push(job.status)
    }

    existing.maxRetryCount = Math.max(existing.maxRetryCount, job.retryCount)

    if (job.updatedAt > existing.lastUpdatedAt) {
      existing.lastUpdatedAt = job.updatedAt
    }
  }

  return {
    total: jobs.length,
    pending: jobs.filter(job => job.status === "pending" && !job.isExpired).length,
    syncing: jobs.filter(job => job.status === "syncing" && !job.isExpired).length,
    failed: jobs.filter(job => job.status === "failed" && !job.isExpired).length,
    synced: jobs.filter(job => job.status === "synced" && !job.isExpired).length,
    expired: jobs.filter(job => job.isExpired).length,
    attempts: Array.from(attempts.values()),
  }
}

export async function getBlockingJobsForUser(userId: string): Promise<ExamSaveJob[]> {
  return (await getPendingJobs()).filter(job => job.userId !== userId)
}

export async function markJobSynced(id: string): Promise<ExamSaveJob> {
  return await withStore("readwrite", async store => {
    const existing = await requestToPromise(store.get(id) as IDBRequest<ExamSaveJob | undefined>)

    if (!existing) {
      throw new Error(`Exam save queue job not found: ${id}`)
    }

    const updatedJob: ExamSaveJob = {
      ...existing,
      status: "synced",
      lastError: undefined,
      updatedAt: new Date().toISOString(),
    }

    await requestToPromise(store.put(updatedJob))
    return updatedJob
  })
}

export async function markJobFailed(id: string, error: string): Promise<ExamSaveJob> {
  return await withStore("readwrite", async store => {
    const existing = await requestToPromise(store.get(id) as IDBRequest<ExamSaveJob | undefined>)

    if (!existing) {
      throw new Error(`Exam save queue job not found: ${id}`)
    }

    const updatedJob: ExamSaveJob = {
      ...existing,
      status: "failed",
      retryCount: existing.retryCount + 1,
      lastError: error,
      updatedAt: new Date().toISOString(),
    }

    await requestToPromise(store.put(updatedJob))
    return updatedJob
  })
}

export async function deleteJobsForAttempt(clientAttemptId: string): Promise<void> {
  await withStore("readwrite", async store => {
    const jobs = (await requestToPromise(store.getAll())) as ExamSaveJob[]

    for (const job of jobs) {
      if (job.clientAttemptId === clientAttemptId) {
        await requestToPromise(store.delete(job.id))
      }
    }
  })
}

export async function deleteExpiredJobs(): Promise<void> {
  await withStore("readwrite", async store => {
    const jobs = (await requestToPromise(store.getAll())) as ExamSaveJob[]
    const now = Date.now()

    for (const job of jobs) {
      if (isExpired(job, now)) {
        await requestToPromise(store.delete(job.id))
      }
    }
  })
}

export async function deleteAllJobs(): Promise<void> {
  await withStore("readwrite", async store => {
    await requestToPromise(store.clear())
  })
}
