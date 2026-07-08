import { AnswerStorage, STORAGE_KEYS } from './answerHandlers'

export type ExamSection = "Listening" | "Reading" | "Writing"

export type ExamDraftState = {
  answers: {
    Listening: Record<string, string>
    Reading: Record<string, string>
    Writing: {
      report: string
      essay: string
    }
  }
  ui: {
    currentSection: ExamSection
    Listening: {
      hasStarted: boolean
      activePart: number
      timerRemaining: number
      audioTime: number
      audioFinished: boolean
      showCountdown: boolean
    }
    Reading: {
      hasStarted: boolean
      activePassage: number
      timerRemaining: number
    }
    Writing: {
      hasStarted: boolean
      activeTask: "1" | "2"
      timerRemaining: number
    }
  }
}

export const DEFAULT_EXAM_DRAFT_STATE: ExamDraftState = {
  answers: {
    Listening: {},
    Reading: {},
    Writing: {
      report: "",
      essay: "",
    },
  },
  ui: {
    currentSection: "Listening",
    Listening: {
      hasStarted: false,
      activePart: 1,
      timerRemaining: 120,
      audioTime: 0,
      audioFinished: false,
      showCountdown: false,
    },
    Reading: {
      hasStarted: false,
      activePassage: 1,
      timerRemaining: 3600,
    },
    Writing: {
      hasStarted: false,
      activeTask: "1",
      timerRemaining: 3600,
    },
  },
}


const LISTENING_SESSION_KEYS = {
  AUDIO_TIME: "listening_audio_time",
  TIMER_REMAINING: "listening_timer_remaining",
  ACTIVE_PART: "listening_active_part",
  HAS_STARTED: "listening_has_started",
  SESSION_ACTIVE: "listening_session_active",
  USER_ID: "listening_user_id",
  AUDIO_FINISHED: "listening_audio_finished",
  SHOW_COUNTDOWN: "listening_show_countdown",
}

const READING_SESSION_KEYS = {
  TIMER_REMAINING: "reading_timer_remaining",
  ACTIVE_PASSAGE: "reading_active_passage",
  HAS_STARTED: "reading_has_started",
  SESSION_ACTIVE: "reading_session_active",
  USER_ID: "reading_user_id",
}

const WRITING_SESSION_KEYS = {
  TIMER_REMAINING: "writing_timer_remaining",
  ACTIVE_TASK: "writing_active_task",
  HAS_STARTED: "writing_has_started",
  SESSION_ACTIVE: "writing_session_active",
  USER_ID: "writing_user_id",
  TASK1_CONTENT: "writing_task1_content",
  TASK2_CONTENT: "writing_task2_content",
}

function cloneDraftState(value: ExamDraftState): ExamDraftState {
  return JSON.parse(JSON.stringify(value)) as ExamDraftState
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, entry == null ? "" : String(entry)])
  )
}

function readNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback

  const value = Number(window.sessionStorage.getItem(key))
  return Number.isFinite(value) ? value : fallback
}

function readOptionalNumber(key: string): number | undefined {
  if (typeof window === "undefined") return undefined

  const rawValue = window.sessionStorage.getItem(key)
  if (rawValue === null) return undefined

  const value = Number(rawValue)
  return Number.isFinite(value) ? value : undefined
}

function readBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback

  const value = window.sessionStorage.getItem(key)
  if (value === "true") return true
  if (value === "false") return false
  return fallback
}

function readOptionalBoolean(key: string): boolean | undefined {
  if (typeof window === "undefined") return undefined

  const value = window.sessionStorage.getItem(key)
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}

function readString(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback
  return window.sessionStorage.getItem(key) || fallback
}

function readOptionalString(key: string): string | undefined {
  if (typeof window === "undefined") return undefined
  return window.sessionStorage.getItem(key) ?? undefined
}

function readBrowserAnswers(
  key: string,
  fallback: Record<string, string>
): Record<string, string> {
  if (typeof window === "undefined") return { ...fallback }

  const rawValue = window.sessionStorage.getItem(key)
  if (rawValue === null) return { ...fallback }

  try {
    return toStringRecord(JSON.parse(rawValue))
  } catch {
    return { ...fallback }
  }
}

function readBrowserWritingAnswers(
  fallback: ExamDraftState["answers"]["Writing"]
): ExamDraftState["answers"]["Writing"] {
  if (typeof window === "undefined") return { ...fallback }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEYS.WRITING_ANSWERS)
  if (rawValue === null) return { ...fallback }

  try {
    const parsed = JSON.parse(rawValue)
    return {
      report: isRecord(parsed) && typeof parsed.report === "string" ? parsed.report : fallback.report,
      essay: isRecord(parsed) && typeof parsed.essay === "string" ? parsed.essay : fallback.essay,
    }
  } catch {
    return { ...fallback }
  }
}

function writeJson(key: string, value: unknown): void {
  window.sessionStorage.setItem(key, JSON.stringify(value))
}

function writeSessionFlag(key: string, value: string): void {
  window.sessionStorage.setItem(key, value)
}

function writeSectionActiveState(keys: { SESSION_ACTIVE: string; HAS_STARTED: string }, isActive: boolean): void {
  writeSessionFlag(keys.SESSION_ACTIVE, String(isActive))
  writeSessionFlag(keys.HAS_STARTED, String(isActive))
}

export function mergeDraftState(input: unknown): ExamDraftState {
  if (!isRecord(input)) return cloneDraftState(DEFAULT_EXAM_DRAFT_STATE)

  const answers = isRecord(input.answers) ? input.answers : {}
  const ui = isRecord(input.ui) ? input.ui : {}
  const listeningUi = isRecord(ui.Listening) ? ui.Listening : {}
  const readingUi = isRecord(ui.Reading) ? ui.Reading : {}
  const writingUi = isRecord(ui.Writing) ? ui.Writing : {}
  const defaultState = DEFAULT_EXAM_DRAFT_STATE

  return {
    answers: {
      Listening: toStringRecord(answers.Listening),
      Reading: toStringRecord(answers.Reading),
      Writing: {
        report: isRecord(answers.Writing) && typeof answers.Writing.report === "string"
          ? answers.Writing.report
          : "",
        essay: isRecord(answers.Writing) && typeof answers.Writing.essay === "string"
          ? answers.Writing.essay
          : "",
      },
    },
    ui: {
      currentSection: ["Listening", "Reading", "Writing"].includes(String(ui.currentSection))
        ? (ui.currentSection as ExamSection)
        : defaultState.ui.currentSection,
      Listening: {
        hasStarted:
          typeof listeningUi.hasStarted === "boolean"
            ? listeningUi.hasStarted
            : defaultState.ui.Listening.hasStarted,
        activePart: Number.isFinite(Number(listeningUi.activePart))
          ? Number(listeningUi.activePart)
          : defaultState.ui.Listening.activePart,
        timerRemaining: Number.isFinite(Number(listeningUi.timerRemaining))
          ? Number(listeningUi.timerRemaining)
          : defaultState.ui.Listening.timerRemaining,
        audioTime: Number.isFinite(Number(listeningUi.audioTime))
          ? Number(listeningUi.audioTime)
          : defaultState.ui.Listening.audioTime,
        audioFinished:
          typeof listeningUi.audioFinished === "boolean"
            ? listeningUi.audioFinished
            : defaultState.ui.Listening.audioFinished,
        showCountdown:
          typeof listeningUi.showCountdown === "boolean"
            ? listeningUi.showCountdown
            : defaultState.ui.Listening.showCountdown,
      },
      Reading: {
        hasStarted:
          typeof readingUi.hasStarted === "boolean"
            ? readingUi.hasStarted
            : defaultState.ui.Reading.hasStarted,
        activePassage: Number.isFinite(Number(readingUi.activePassage))
          ? Number(readingUi.activePassage)
          : defaultState.ui.Reading.activePassage,
        timerRemaining: Number.isFinite(Number(readingUi.timerRemaining))
          ? Number(readingUi.timerRemaining)
          : defaultState.ui.Reading.timerRemaining,
      },
      Writing: {
        hasStarted:
          typeof writingUi.hasStarted === "boolean"
            ? writingUi.hasStarted
            : defaultState.ui.Writing.hasStarted,
        activeTask: writingUi.activeTask === "2" ? "2" : "1",
        timerRemaining: Number.isFinite(Number(writingUi.timerRemaining))
          ? Number(writingUi.timerRemaining)
          : defaultState.ui.Writing.timerRemaining,
      },
    },
  }
}

export function buildDraftStateFromBrowser(
  currentSection: ExamSection,
  fallbackDraftState?: ExamDraftState
): ExamDraftState {
  const fallbackState = fallbackDraftState
    ? mergeDraftState(fallbackDraftState)
    : cloneDraftState(DEFAULT_EXAM_DRAFT_STATE)
  const fallbackWritingAnswers = fallbackState.answers.Writing
  const activeTask = readOptionalString(WRITING_SESSION_KEYS.ACTIVE_TASK)

  return {
    answers: {
      Listening: readBrowserAnswers(STORAGE_KEYS.LISTENING_ANSWERS, fallbackState.answers.Listening),
      Reading: readBrowserAnswers(STORAGE_KEYS.READING_ANSWERS, fallbackState.answers.Reading),
      Writing: readBrowserWritingAnswers(fallbackWritingAnswers),
    },
    ui: {
      currentSection,
      Listening: {
        hasStarted: readOptionalBoolean(LISTENING_SESSION_KEYS.HAS_STARTED) ?? fallbackState.ui.Listening.hasStarted,
        activePart: readOptionalNumber(LISTENING_SESSION_KEYS.ACTIVE_PART) ?? fallbackState.ui.Listening.activePart,
        timerRemaining: readOptionalNumber(LISTENING_SESSION_KEYS.TIMER_REMAINING) ?? fallbackState.ui.Listening.timerRemaining,
        audioTime: readOptionalNumber(LISTENING_SESSION_KEYS.AUDIO_TIME) ?? fallbackState.ui.Listening.audioTime,
        audioFinished: readOptionalBoolean(LISTENING_SESSION_KEYS.AUDIO_FINISHED) ?? fallbackState.ui.Listening.audioFinished,
        showCountdown: readOptionalBoolean(LISTENING_SESSION_KEYS.SHOW_COUNTDOWN) ?? fallbackState.ui.Listening.showCountdown,
      },
      Reading: {
        hasStarted: readOptionalBoolean(READING_SESSION_KEYS.HAS_STARTED) ?? fallbackState.ui.Reading.hasStarted,
        activePassage: readOptionalNumber(READING_SESSION_KEYS.ACTIVE_PASSAGE) ?? fallbackState.ui.Reading.activePassage,
        timerRemaining: readOptionalNumber(READING_SESSION_KEYS.TIMER_REMAINING) ?? fallbackState.ui.Reading.timerRemaining,
      },
      Writing: {
        hasStarted: readOptionalBoolean(WRITING_SESSION_KEYS.HAS_STARTED) ?? fallbackState.ui.Writing.hasStarted,
        activeTask: activeTask === "2" ? "2" : activeTask === "1" ? "1" : fallbackState.ui.Writing.activeTask,
        timerRemaining: readOptionalNumber(WRITING_SESSION_KEYS.TIMER_REMAINING) ?? fallbackState.ui.Writing.timerRemaining,
      },
    },
  }
}

export function hydrateBrowserFromDraftState(draftState: ExamDraftState): void {
  if (typeof window === "undefined") return

  const nextState = mergeDraftState(draftState)
  const session = AnswerStorage.getTestSession()
  const userId = session?.userId || ""

  writeJson(STORAGE_KEYS.LISTENING_ANSWERS, nextState.answers.Listening)
  writeJson(STORAGE_KEYS.READING_ANSWERS, nextState.answers.Reading)
  writeJson(STORAGE_KEYS.WRITING_ANSWERS, nextState.answers.Writing)

  writeSectionActiveState(
    LISTENING_SESSION_KEYS,
    nextState.ui.currentSection === "Listening" && (
      nextState.ui.Listening.hasStarted ||
      readBoolean(LISTENING_SESSION_KEYS.HAS_STARTED, false)
    )
  )
  writeSessionFlag(LISTENING_SESSION_KEYS.USER_ID, userId)
  writeSessionFlag(LISTENING_SESSION_KEYS.ACTIVE_PART, String(nextState.ui.Listening.activePart))
  writeSessionFlag(LISTENING_SESSION_KEYS.TIMER_REMAINING, String(nextState.ui.Listening.timerRemaining))
  writeSessionFlag(LISTENING_SESSION_KEYS.AUDIO_TIME, String(nextState.ui.Listening.audioTime))
  writeSessionFlag(LISTENING_SESSION_KEYS.AUDIO_FINISHED, String(nextState.ui.Listening.audioFinished))
  writeSessionFlag(LISTENING_SESSION_KEYS.SHOW_COUNTDOWN, String(nextState.ui.Listening.showCountdown))

  writeSectionActiveState(
    READING_SESSION_KEYS,
    nextState.ui.currentSection === "Reading" && (
      nextState.ui.Reading.hasStarted ||
      readBoolean(READING_SESSION_KEYS.HAS_STARTED, false)
    )
  )
  writeSessionFlag(READING_SESSION_KEYS.USER_ID, userId)
  writeSessionFlag(READING_SESSION_KEYS.ACTIVE_PASSAGE, String(nextState.ui.Reading.activePassage))
  writeSessionFlag(READING_SESSION_KEYS.TIMER_REMAINING, String(nextState.ui.Reading.timerRemaining))

  writeSectionActiveState(
    WRITING_SESSION_KEYS,
    nextState.ui.currentSection === "Writing" && (
      nextState.ui.Writing.hasStarted ||
      readBoolean(WRITING_SESSION_KEYS.HAS_STARTED, false)
    )
  )
  writeSessionFlag(WRITING_SESSION_KEYS.USER_ID, userId)
  writeSessionFlag(WRITING_SESSION_KEYS.ACTIVE_TASK, nextState.ui.Writing.activeTask)
  writeSessionFlag(WRITING_SESSION_KEYS.TIMER_REMAINING, String(nextState.ui.Writing.timerRemaining))
  writeSessionFlag(WRITING_SESSION_KEYS.TASK1_CONTENT, nextState.answers.Writing.report)
  writeSessionFlag(WRITING_SESSION_KEYS.TASK2_CONTENT, nextState.answers.Writing.essay)

  window.dispatchEvent(new Event("answersUpdated"))
}
