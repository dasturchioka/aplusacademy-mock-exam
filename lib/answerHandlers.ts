'use client'

// Migration function to transfer localStorage to sessionStorage
function migrateFromLocalStorage() {
	if (typeof window === 'undefined') return

	// List of all exam-related keys to migrate
	const EXAM_KEYS = [
		'ielts_listening_answers',
		'ielts_reading_answers',
		'ielts_writing_answers',
		'ielts_current_result_id',
		'ielts_test_session',
		'ielts-exam-answers', // Zustand store key
		// Session keys
		'writing_timer_remaining',
		'writing_active_task',
		'writing_has_started',
		'writing_session_active',
		'writing_user_id',
		'writing_exam_start_time',
		'writing_task1_content',
		'writing_task2_content',
		'listening_audio_time',
		'listening_timer_remaining',
		'listening_active_part',
		'listening_has_started',
		'listening_session_active',
		'listening_user_id',
		'listening_exam_start_time',
		'listening_audio_finished',
		'listening_show_countdown',
		'reading_timer_remaining',
		'reading_active_passage',
		'reading_has_started',
		'reading_session_active',
		'reading_user_id',
		'reading_exam_start_time',
	]

	let migratedCount = 0

	EXAM_KEYS.forEach(key => {
		const localValue = localStorage.getItem(key)
		if (localValue !== null) {
			// Transfer to sessionStorage
			sessionStorage.setItem(key, localValue)
			// Remove from localStorage
			localStorage.removeItem(key)
			migratedCount++
		}
	})

	if (migratedCount > 0) {
		console.log(`🔄 Migrated ${migratedCount} exam keys from localStorage to sessionStorage`)
	}
}

// Run migration on module load
migrateFromLocalStorage()

// Local storage keys
export const STORAGE_KEYS = {
	LISTENING_ANSWERS: 'ielts_listening_answers',
	READING_ANSWERS: 'ielts_reading_answers',
	WRITING_ANSWERS: 'ielts_writing_answers',
	CURRENT_RESULT_ID: 'ielts_current_result_id',
	CURRENT_TEST_SESSION: 'ielts_test_session',
}

const SECTION_SESSION_KEYS = [
	'writing_timer_remaining',
	'writing_active_task',
	'writing_has_started',
	'writing_session_active',
	'writing_user_id',
	'writing_exam_start_time',
	'writing_task1_content',
	'writing_task2_content',
	'listening_audio_time',
	'listening_timer_remaining',
	'listening_active_part',
	'listening_has_started',
	'listening_session_active',
	'listening_user_id',
	'listening_exam_start_time',
	'listening_audio_finished',
	'listening_show_countdown',
	'reading_timer_remaining',
	'reading_active_passage',
	'reading_has_started',
	'reading_session_active',
	'reading_user_id',
	'reading_exam_start_time',
]

const OLD_EXAM_LOCAL_STORAGE_KEYS = [
	...Object.values(STORAGE_KEYS),
	...SECTION_SESSION_KEYS,
	'ielts-exam-answers',
	'userId',
]

export function clearExamSessionStorage(): void {
	if (typeof window === 'undefined') return

	Object.values(STORAGE_KEYS).forEach(key => sessionStorage.removeItem(key))
	SECTION_SESSION_KEYS.forEach(key => sessionStorage.removeItem(key))
	sessionStorage.removeItem('ielts-exam-answers')
	sessionStorage.removeItem('ielts_exam_completion_ready')
}

export function clearOldExamLocalStorage(): void {
	if (typeof window === 'undefined') return

	OLD_EXAM_LOCAL_STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
}

export function clearVisibleExamState(): void {
	clearExamSessionStorage()
	clearOldExamLocalStorage()
}

// Session data interface
interface TestSession {
	userId: string
	testId: string
	resultId?: string
	clientAttemptId?: string
	attemptId?: string
	startedAt: string
}

// Answer storage utilities
class AnswerStorage {
	// Session management
	static setTestSession(
		userId: string,
		testId: string,
		clientAttemptId?: string,
		attemptId?: string
	): void {
		const existingSession = this.getTestSession()
		const isSameSession =
			existingSession?.userId === userId &&
			existingSession?.testId === testId &&
			(!attemptId || existingSession?.attemptId === attemptId)

		const session: TestSession = {
			userId,
			testId,
			resultId: isSameSession ? existingSession?.resultId : undefined,
			clientAttemptId: clientAttemptId ?? (isSameSession ? existingSession?.clientAttemptId : undefined),
			attemptId: attemptId ?? (isSameSession ? existingSession?.attemptId : undefined),
			startedAt: isSameSession
				? existingSession?.startedAt || new Date().toISOString()
				: new Date().toISOString(),
		}
		sessionStorage.setItem(STORAGE_KEYS.CURRENT_TEST_SESSION, JSON.stringify(session))
	}

	static getTestSession(): TestSession | null {
		const session = sessionStorage.getItem(STORAGE_KEYS.CURRENT_TEST_SESSION)
		return session ? JSON.parse(session) : null
	}

	static setResultId(resultId: string): void {
		const session = this.getTestSession()
		if (session) {
			session.resultId = resultId
			sessionStorage.setItem(STORAGE_KEYS.CURRENT_TEST_SESSION, JSON.stringify(session))
		}
		sessionStorage.setItem(STORAGE_KEYS.CURRENT_RESULT_ID, resultId)
	}

	static getResultId(): string | null {
		return sessionStorage.getItem(STORAGE_KEYS.CURRENT_RESULT_ID)
	}

	static setClientAttemptId(clientAttemptId: string): void {
		const session = this.getTestSession()
		if (!session) {
			throw new Error('No active test session found')
		}

		session.clientAttemptId = clientAttemptId
		sessionStorage.setItem(STORAGE_KEYS.CURRENT_TEST_SESSION, JSON.stringify(session))
	}

	static getClientAttemptId(): string | null {
		return this.getTestSession()?.clientAttemptId ?? null
	}

	static getAttemptId(): string | null {
		return this.getTestSession()?.attemptId ?? null
	}

	static clearIfDifferentAttempt(userId: string, testId: string, attemptId: string): void {
		if (typeof window === 'undefined') return

		const existingSession = this.getTestSession()
		if (!existingSession) return

		if (
			existingSession.userId !== userId ||
			existingSession.testId !== testId ||
			existingSession.attemptId !== attemptId
		) {
			clearVisibleExamState()
		}
	}

	// Answer storage by section
	static saveAnswer(
		section: 'Listening' | 'Reading' | 'Writing',
		questionNumber: string,
		answer: string
	): void {
		const key =
			section === 'Listening'
				? STORAGE_KEYS.LISTENING_ANSWERS
				: section === 'Reading'
				? STORAGE_KEYS.READING_ANSWERS
				: STORAGE_KEYS.WRITING_ANSWERS

		const currentAnswers = this.getAnswers(section)
		currentAnswers[questionNumber] = answer
		sessionStorage.setItem(key, JSON.stringify(currentAnswers))
		window.dispatchEvent(new Event('answersUpdated'))

		console.log(`💾 Saved ${section} Q${questionNumber}: ${answer}`)
	}

	static getAnswers(section: 'Listening' | 'Reading' | 'Writing'): Record<string, string> {
		const key =
			section === 'Listening'
				? STORAGE_KEYS.LISTENING_ANSWERS
				: section === 'Reading'
				? STORAGE_KEYS.READING_ANSWERS
				: STORAGE_KEYS.WRITING_ANSWERS

		const stored = sessionStorage.getItem(key)
		return stored ? JSON.parse(stored) : {}
	}

	static getAnswer(section: 'Listening' | 'Reading' | 'Writing', questionNumber: string): string {
		const answers = this.getAnswers(section)
		return answers[questionNumber] || ''
	}

	static clearSection(section: 'Listening' | 'Reading' | 'Writing'): void {
		const key =
			section === 'Listening'
				? STORAGE_KEYS.LISTENING_ANSWERS
				: section === 'Reading'
				? STORAGE_KEYS.READING_ANSWERS
				: STORAGE_KEYS.WRITING_ANSWERS
		sessionStorage.removeItem(key)
	}

	static clearAll(): void {
		clearExamSessionStorage()
	}

	// Helper function to clear stored test result ID
	static clearStoredTestResultId(): void {
		sessionStorage.removeItem(STORAGE_KEYS.CURRENT_RESULT_ID)
	}
}

// Question type specific handlers
export class QuestionHandlers {
	// Form/Note/Sentence Completion Handler
	static createFormCompletionHandler(
		section: 'Listening' | 'Reading',
		questionStart: number,
		questionEnd: number
	) {
		return (answers: Array<{ number: number; answer: string }> | Record<number, string>) => {
			console.log(`📝 Form completion Q${questionStart}-${questionEnd}:`, answers)

			// Convert old format to new format if needed
			let formattedAnswers: Array<{ number: number; answer: string }> = []

			if (Array.isArray(answers)) {
				formattedAnswers = answers
			} else {
				// Convert old object format to new array format
				formattedAnswers = Object.entries(answers).map(([qNum, answer]) => ({
					number: parseInt(qNum),
					answer: answer || '',
				}))
			}

			// Save each answer in the new format
			formattedAnswers.forEach(({ number, answer }) => {
				if (number >= questionStart && number <= questionEnd) {
					AnswerStorage.saveAnswer(section, number.toString(), answer)
				}
			})
		}
	}

	// Multiple Choice Handler
	static createMultipleChoiceHandler(
		section: 'Listening' | 'Reading',
		questionStart: number,
		questionEnd?: number
	) {
		return (selectedOption: string | Array<{ number: number; answer: string }>) => {
			console.log(
				`🔘 Multiple choice Q${questionStart}${questionEnd ? `-${questionEnd}` : ''}:`,
				selectedOption
			)

			if (typeof selectedOption === 'string') {
				// Single question answer
				AnswerStorage.saveAnswer(section, questionStart.toString(), selectedOption || '')
				console.log(`✅ Saved multiple choice Q${questionStart}: ${selectedOption}`)
			} else if (Array.isArray(selectedOption)) {
				// Multiple questions array - save all answers in the block
				selectedOption.forEach(({ number, answer }) => {
					AnswerStorage.saveAnswer(section, number.toString(), answer || '')
					console.log(`✅ Saved multiple choice Q${number}: ${answer}`)
				})
			}
		}
	}

	static removeAnswer(section: 'Listening' | 'Reading' | 'Writing', questionNumber: string) {
		const storageKey =
			section === 'Listening'
				? STORAGE_KEYS.LISTENING_ANSWERS
				: section === 'Reading'
				? STORAGE_KEYS.READING_ANSWERS
				: STORAGE_KEYS.WRITING_ANSWERS

		const raw = sessionStorage.getItem(storageKey) || '{}'
		const parsed = JSON.parse(raw)

		delete parsed[questionNumber]

		sessionStorage.setItem(storageKey, JSON.stringify(parsed))
		window.dispatchEvent(new Event('answersUpdated'))
	}

	// Multiple Select Handler - Fixed logic for option mapping
	static createMultipleSelectHandler(
		section: 'Listening' | 'Reading',
		questionStart: number,
		questionEnd: number
	) {
		return (selectedOptions: string[] | Array<{ number: number; answer: string }>) => {
			console.log(`☑️ Multiple select Q${questionStart}-${questionEnd}:`, selectedOptions)

			// 🧹 First clear existing answers in the range
			for (let qn = questionStart; qn <= questionEnd; qn++) {
				this.removeAnswer(section, qn.toString())
			}

			// ✅ Then save the current selections
			if (Array.isArray(selectedOptions) && selectedOptions.length > 0) {
				if (typeof selectedOptions[0] === 'string') {
					// Handle string array - map options to questions by index
					const options = selectedOptions as string[]
					options.forEach((option, index) => {
						const questionNum = questionStart + index
						if (questionNum <= questionEnd && option) {
							AnswerStorage.saveAnswer(section, questionNum.toString(), option)
							console.log(`✅ Mapped option "${option}" to Q${questionNum}`)
						}
					})
				} else {
					// Handle new array format
					const formattedAnswers = selectedOptions as Array<{ number: number; answer: string }>
					formattedAnswers.forEach(({ number, answer }) => {
						if (number >= questionStart && number <= questionEnd) {
							AnswerStorage.saveAnswer(section, number.toString(), answer || '')
						}
					})
				}
			}
		}
	}

	// Map/Diagram Labelling Handler
	static createLabellingHandler(
		section: 'Listening' | 'Reading',
		questionStart: number,
		questionEnd: number
	) {
		return (answers: Array<{ number: number; answer: string }> | Record<number, string>) => {
			console.log(`🗺️ Labelling answers Q${questionStart}-${questionEnd}:`, answers)

			// Convert old format to new format if needed
			let formattedAnswers: Array<{ number: number; answer: string }> = []

			if (Array.isArray(answers)) {
				formattedAnswers = answers
			} else {
				// Convert old object format to new array format
				formattedAnswers = Object.entries(answers).map(([qNum, answer]) => ({
					number: parseInt(qNum),
					answer: answer || '',
				}))
			}

			// Save each answer
			formattedAnswers.forEach(({ number, answer }) => {
				if (number >= questionStart && number <= questionEnd) {
					AnswerStorage.saveAnswer(section, number.toString(), answer)
					console.log(`✅ Saved labelling Q${number}: ${answer}`)
				}
			})
		}
	}

	// Matching Handler
	static createMatchingHandler(
		section: 'Listening' | 'Reading',
		questionStart: number,
		questionEnd: number
	) {
		return (matches: Array<{ number: number; answer: string }> | Record<number, string>) => {
			console.log(`🔗 Matching answers Q${questionStart}-${questionEnd}:`, matches)

			// Convert old format to new format if needed
			let formattedAnswers: Array<{ number: number; answer: string }> = []

			if (Array.isArray(matches)) {
				formattedAnswers = matches
			} else {
				// Convert old object format to new array format
				formattedAnswers = Object.entries(matches).map(([qNum, match]) => ({
					number: parseInt(qNum),
					answer: match || '',
				}))
			}

			// Save each match
			formattedAnswers.forEach(({ number, answer }) => {
				if (number >= questionStart && number <= questionEnd) {
					AnswerStorage.saveAnswer(section, number.toString(), answer)
					console.log(`✅ Saved matching Q${number}: ${answer}`)
				}
			})
		}
	}

	// True/False/Not Given Handler
	static createTrueFalseHandler(section: 'Reading', questionStart: number, questionEnd: number) {
		return (
			answers:
				| Array<{ number: number; answer: string }>
				| Record<number, 'TRUE' | 'FALSE' | 'NOT GIVEN'>
		) => {
			console.log(`✅ True/False answers Q${questionStart}-${questionEnd}:`, answers)

			// Convert old format to new format if needed
			let formattedAnswers: Array<{ number: number; answer: string }> = []

			if (Array.isArray(answers)) {
				formattedAnswers = answers
			} else {
				// Convert old object format to new array format
				formattedAnswers = Object.entries(answers).map(([qNum, answer]) => ({
					number: parseInt(qNum),
					answer: answer || '',
				}))
			}

			// Save each answer
			formattedAnswers.forEach(({ number, answer }) => {
				if (number >= questionStart && number <= questionEnd) {
					AnswerStorage.saveAnswer(section, number.toString(), answer)
					console.log(`✅ Saved True/False Q${number}: ${answer}`)
				}
			})
		}
	}

	// Yes/No/Not Given Handler
	static createYesNoHandler(section: 'Reading', questionStart: number, questionEnd: number) {
		return (
			answers:
				| Array<{ number: number; answer: string }>
				| Record<number, 'YES' | 'NO' | 'NOT GIVEN'>
		) => {
			console.log(`✅ Yes/No answers Q${questionStart}-${questionEnd}:`, answers)

			// Convert old format to new format if needed
			let formattedAnswers: Array<{ number: number; answer: string }> = []

			if (Array.isArray(answers)) {
				formattedAnswers = answers
			} else {
				// Convert old object format to new array format
				formattedAnswers = Object.entries(answers).map(([qNum, answer]) => ({
					number: parseInt(qNum),
					answer: answer || '',
				}))
			}

			// Save each answer
			formattedAnswers.forEach(({ number, answer }) => {
				if (number >= questionStart && number <= questionEnd) {
					AnswerStorage.saveAnswer(section, number.toString(), answer)
					console.log(`✅ Saved Yes/No Q${number}: ${answer}`)
				}
			})
		}
	}

	// Summary Completion Handler
	static createSummaryCompletionHandler(
		section: 'Reading',
		questionStart: number,
		questionEnd: number
	) {
		return (answers: Array<{ number: number; answer: string }> | Record<number, string>) => {
			console.log(`📄 Summary completion Q${questionStart}-${questionEnd}:`, answers)

			// Convert old format to new format if needed
			let formattedAnswers: Array<{ number: number; answer: string }> = []

			if (Array.isArray(answers)) {
				formattedAnswers = answers
			} else {
				// Convert old object format to new array format
				formattedAnswers = Object.entries(answers).map(([qNum, answer]) => ({
					number: parseInt(qNum),
					answer: answer || '',
				}))
			}

			// Save each answer
			formattedAnswers.forEach(({ number, answer }) => {
				if (number >= questionStart && number <= questionEnd) {
					AnswerStorage.saveAnswer(section, number.toString(), answer)
				}
			})
		}
	}

	// Summary Select Completion Handler
	static createSummarySelectHandler(
		section: 'Reading',
		questionStart: number,
		questionEnd: number
	) {
		return (answers: Array<{ number: number; answer: string }>) => {
			console.log(`📄 Summary select completion Q${questionStart}-${questionEnd}:`, answers)

			answers.forEach(({ number, answer }) => {
				if (number >= questionStart && number <= questionEnd) {
					AnswerStorage.saveAnswer(section, number.toString(), answer || '')
				}
			})
		}
	}

	// Match Heading Handler
	static createMatchHeadingHandler(section: 'Reading', questionStart: number, questionEnd: number) {
		return (matches: Array<{ number: number; answer: string }> | Record<number, string>) => {
			console.log(`📋 Match heading Q${questionStart}-${questionEnd}:`, matches)

			// Convert old format to new format if needed
			let formattedAnswers: Array<{ number: number; answer: string }> = []

			if (Array.isArray(matches)) {
				formattedAnswers = matches
			} else {
				// Convert old object format to new array format
				formattedAnswers = Object.entries(matches).map(([qNum, heading]) => ({
					number: parseInt(qNum),
					answer: heading || '',
				}))
			}

			// Save each match
			formattedAnswers.forEach(({ number, answer }) => {
				if (number >= questionStart && number <= questionEnd) {
					AnswerStorage.saveAnswer(section, number.toString(), answer)
				}
			})
		}
	}

	// Table Completion Handler
	static createTableCompletionHandler(
		section: 'Listening' | 'Reading',
		questionStart: number,
		questionEnd: number
	) {
		console.log('being rendered table completion handler')

		return (answers: Array<{ number: number; answer: string }> | Record<number, string>) => {
			console.log(`📊 Table completion Q${questionStart}-${questionEnd}:`, answers)

			// Convert old format to new format if needed
			let formattedAnswers: Array<{ number: number; answer: string }> = []

			if (Array.isArray(answers)) {
				formattedAnswers = answers
			} else {
				// Convert old object format to new array format
				formattedAnswers = Object.entries(answers).map(([qNum, answer]) => ({
					number: parseInt(qNum),
					answer: answer || '',
				}))
			}

			// Save each answer
			formattedAnswers.forEach(({ number, answer }) => {
				if (number >= questionStart && number <= questionEnd) {
					AnswerStorage.saveAnswer(section, number.toString(), answer)
				}
			})
		}
	}

	// Flow Chart Handler
	static createFlowChartHandler(
		section: 'Listening' | 'Reading',
		questionStart: number,
		questionEnd: number
	) {
		return (answers: Array<{ number: number; answer: string }> | Record<number, string>) => {
			console.log(`📈 Flow chart Q${questionStart}-${questionEnd}:`, answers)

			// Convert old format to new format if needed
			let formattedAnswers: Array<{ number: number; answer: string }> = []

			if (Array.isArray(answers)) {
				formattedAnswers = answers
			} else {
				// Convert old object format to new array format
				formattedAnswers = Object.entries(answers).map(([qNum, answer]) => ({
					number: parseInt(qNum),
					answer: answer || '',
				}))
			}

			// Save each answer
			formattedAnswers.forEach(({ number, answer }) => {
				if (number >= questionStart && number <= questionEnd) {
					AnswerStorage.saveAnswer(section, number.toString(), answer)
				}
			})
		}
	}

	// Writing Task Handler
	static createWritingHandler() {
		return (taskType: 'report' | 'essay', content: string) => {
			console.log(`✍️ Writing ${taskType}: ${content.substring(0, 50)}...`)
			AnswerStorage.saveAnswer('Writing', taskType, content)
		}
	}

	// Get stored answer for display
	static getStoredAnswer(
		section: 'Listening' | 'Reading' | 'Writing',
		questionNumber: string
	): string {
		return AnswerStorage.getAnswer(section, questionNumber)
	}

	// Get all stored answers for a section
	static getAllStoredAnswers(section: 'Listening' | 'Reading' | 'Writing'): Record<string, string> {
		return AnswerStorage.getAnswers(section)
	}
}

// Export storage utilities
export { AnswerStorage }
