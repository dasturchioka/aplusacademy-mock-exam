import type { CorrectAnswersStructure } from '@/lib/answerEvaluation'

export type ResultSectionName = 'Listening' | 'Reading' | 'Writing' | 'Speaking'
export type ResultLifecycleStatus = 'draft' | 'completed' | 'abandoned'

export interface ResultAnswer {
	[questionNumber: string]: string | boolean | null | undefined
	isCorrect?: boolean | null
}

export interface WritingAnswer {
	report?: string
	essay?: string
}

export interface SectionResult {
	Listening?: ResultAnswer[]
	Reading?: ResultAnswer[]
	Writing?: WritingAnswer[]
	Speaking?: ResultAnswer[]
}

export interface ResultTestInfo {
	id?: string
	title?: string
	edition?: string | null
	test_number?: number | null
	correct_answers?: CorrectAnswersStructure | null
}

export interface ResultUserInfo {
	id?: string
	full_name?: string
	email?: string
}

export interface ResultAttemptSummary {
	id: string
	status: string
	current_section?: string | null
	section_status?: Record<string, string> | null
	last_activity_at?: string | null
	completed_at?: string | null
}

export interface ResultDetail {
	id: string
	exam_taker_id: string
	test_id: string
	taken_date: string
	results: SectionResult[] | null
	display_results?: SectionResult[] | null
	listening_score: number | null
	reading_score: number | null
	writing_score: number | null
	speaking_score: number | null
	overall_score: number | null
	reviewed_by: string | null
	reviewed_at: string | null
	email_sent: boolean | null
	feedback?: string | null
	status?: ResultLifecycleStatus | string
	completed_at?: string | null
	created_at: string
	updated_at?: string
	is_published: boolean
	published_at: string | null
	is_analysis_published: boolean
	analysis_published_at: string | null
	users?: ResultUserInfo
	tests?: ResultTestInfo
	attempt?: ResultAttemptSummary | null
}

export interface QuestionReviewRow {
	questionNumber: number
	answer: ResultAnswer
	userAnswer: string
	hasUserAnswer: boolean
	isCorrect: boolean | null
}

export function getSectionName(sectionResult: SectionResult): ResultSectionName | null {
	const sectionName = Object.keys(sectionResult)[0] as ResultSectionName | undefined
	return sectionName || null
}

export function getAnswerValue(answer: ResultAnswer, fallbackQuestionNumber: number): string {
	const questionKey = Object.keys(answer).find(key => key !== 'isCorrect') || String(fallbackQuestionNumber)
	const rawAnswer = answer[questionKey]
	if (typeof rawAnswer === 'string') return rawAnswer
	if (rawAnswer === null || rawAnswer === undefined) return ''
	return String(rawAnswer)
}

function normalizeAnswerMap(value: unknown): ResultAnswer[] {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return []

	return Object.entries(value as Record<string, unknown>)
		.filter(([, answer]) => String(answer ?? '').trim() !== '')
		.sort(([left], [right]) => Number(left) - Number(right))
		.map(([questionNumber, answer]) => ({
			[questionNumber]: String(answer ?? ''),
			isCorrect: null,
		}))
}

export function normalizeSectionsForReview(sections?: unknown[] | null): SectionResult[] {
	if (!Array.isArray(sections)) return []

	return sections
		.map(sectionResult => {
			if (!sectionResult || typeof sectionResult !== 'object' || Array.isArray(sectionResult)) return null

			const typedSection = sectionResult as Record<string, unknown>
			const sectionName = (['Listening', 'Reading', 'Writing', 'Speaking'] as const).find(name =>
				Object.prototype.hasOwnProperty.call(typedSection, name)
			)
			if (!sectionName) return null

			const value = typedSection[sectionName]
			if (Array.isArray(value)) return sectionResult as SectionResult

			if (sectionName === 'Listening') return { Listening: normalizeAnswerMap(value) }
			if (sectionName === 'Reading') return { Reading: normalizeAnswerMap(value) }

			if (sectionName === 'Writing' && value && typeof value === 'object') {
				const writing = value as WritingAnswer
				return { Writing: [{ report: writing.report || '' }, { essay: writing.essay || '' }] }
			}

			return null
		})
		.filter((section): section is SectionResult => Boolean(section))
}

export function buildQuestionRows(sectionName: string, answers: ResultAnswer[]): QuestionReviewRow[] {
	if (sectionName === 'Listening' || sectionName === 'Reading') {
		return Array.from({ length: 40 }, (_, index) => {
			const questionNumber = index + 1
			const existingAnswer = answers.find(answer => {
				const questionKey = Object.keys(answer).find(key => key !== 'isCorrect')
				return questionKey === String(questionNumber)
			})
			const answer = existingAnswer || { [String(questionNumber)]: '', isCorrect: null }
			const userAnswer = getAnswerValue(answer, questionNumber)
			const hasUserAnswer = Boolean(existingAnswer && userAnswer.trim())
			return {
				questionNumber,
				answer,
				userAnswer,
				hasUserAnswer,
				isCorrect: hasUserAnswer ? (answer.isCorrect === true ? true : answer.isCorrect === false ? false : null) : null,
			}
		})
	}

	return answers.map((answer, index) => {
		const questionNumber = index + 1
		const userAnswer = getAnswerValue(answer, questionNumber)
		return {
			questionNumber,
			answer,
			userAnswer,
			hasUserAnswer: Boolean(userAnswer.trim()),
			isCorrect: answer.isCorrect === true ? true : answer.isCorrect === false ? false : null,
		}
	})
}

export function countCorrectRows(rows: QuestionReviewRow[]) {
	return rows.filter(row => row.isCorrect === true).length
}

export function wordCount(text?: string) {
	return text?.trim() ? text.trim().split(/\s+/).length : 0
}

export function formatResultDate(value?: string | null) {
	if (!value) return 'Not available'
	return new Date(value).toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
}
