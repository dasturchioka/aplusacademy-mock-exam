import { completeAttemptAndWait, saveSectionAndWait } from '@/lib/examSaveRunner'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface SectionAnswers {
	Listening: Record<string, string>
	Reading: Record<string, string>
	Writing: {
		report?: string
		essay?: string
	}
}

export interface AnswerSubmission {
	userId: string
	testId: string
	answers: SectionAnswers
	submittedAt: string
}

interface AnswerStore {
	currentUserId: string | null
	currentTestId: string | null
	answers: SectionAnswers
	currentSection: 'Listening' | 'Reading' | 'Writing' | null
	isSubmitting: boolean
	submissionError: string | null
	isSavingSection: boolean
	sectionSaveError: string | null
	answersListening: Record<string, string>
	answersReading: Record<string, string>
	initializeTest: (userId: string, testId: string) => void
	setAnswer: (
		section: 'Listening' | 'Reading' | 'Writing',
		questionNumber: string,
		value: string
	) => void
	setCurrentSection: (section: 'Listening' | 'Reading' | 'Writing') => void
	getAnswer: (
		section: 'Listening' | 'Reading' | 'Writing',
		questionNumber: string
	) => string | undefined
	clearAnswers: () => void
	submitAnswers: () => Promise<boolean>
	exportAnswers: () => AnswerSubmission | null
	saveCurrentSection: () => Promise<boolean>
	saveSectionImmediate: (section: 'Listening' | 'Reading' | 'Writing') => Promise<boolean>
	setAnswerForQuestionIndicator: (
		section: 'Listening' | 'Reading',
		number: string,
		val: string | any
	) => void
}

export const useAnswerStore = create<AnswerStore>()(
	devtools(
		persist(
			(set, get) => ({
				currentUserId: null,
				currentTestId: null,
				answers: {
					Listening: {},
					Reading: {},
					Writing: {},
				},
				currentSection: null,
				isSubmitting: false,
				submissionError: null,
				isSavingSection: false,
				sectionSaveError: null,
				answersListening: {},
				answersReading: {},

				initializeTest: (userId: string, testId: string) => {
					set({
						currentUserId: userId,
						currentTestId: testId,
						answers: {
							Listening: {},
							Reading: {},
							Writing: {},
						},
						currentSection: 'Listening',
						submissionError: null,
						sectionSaveError: null,
					})
				},

				setAnswer: (section, questionNumber, value) => {
					const state = get()
					const newAnswers = { ...state.answers }

					if (section === 'Writing') {
						newAnswers.Writing = {
							...newAnswers.Writing,
							[questionNumber]: value,
						}
					} else {
						newAnswers[section] = {
							...newAnswers[section],
							[questionNumber]: value,
						}
					}

					set({ answers: newAnswers })
				},

				setAnswerForQuestionIndicator: (section, questionNumber, value) => {
					if (section !== 'Listening' && section !== 'Reading') return

					set(state => {
						const key = section === 'Listening' ? 'answersListening' : 'answersReading'

						return {
							[key]: {
								...state[key],
								[questionNumber]: value,
							},
						}
					})
				},

				setCurrentSection: section => {
					set({ currentSection: section })
				},

				getAnswer: (section, questionNumber) => {
					const state = get()
					if (section === 'Writing') {
						return state.answers.Writing[questionNumber as keyof typeof state.answers.Writing]
					}
					return state.answers[section][questionNumber]
				},

				clearAnswers: () => {
					set({
						answers: {
							Listening: {},
							Reading: {},
							Writing: {},
						},
						currentUserId: null,
						currentTestId: null,
						currentSection: null,
						submissionError: null,
						sectionSaveError: null,
					})
				},

				// Save current section immediately
				saveCurrentSection: async () => {
					const state = get()
					if (!state.currentSection) return false
					return get().saveSectionImmediate(state.currentSection)
				},

				// Save specific section immediately with strict formatting
				saveSectionImmediate: async (section: 'Listening' | 'Reading' | 'Writing') => {
					const state = get()
					if (!state.currentUserId || !state.currentTestId) {
						set({ sectionSaveError: 'No active test session' })
						return false
					}

					set({ isSavingSection: true, sectionSaveError: null })

					try {
						await saveSectionAndWait(section)
						set({ isSavingSection: false })
						return true
					} catch (error) {
						console.error(`Error saving ${section} section:`, error)
						set({
							isSavingSection: false,
							sectionSaveError:
								error instanceof Error ? error.message : `Failed to save ${section} section`,
						})
						return false
					}
				},

				submitAnswers: async () => {
					const state = get()
					if (!state.currentUserId || !state.currentTestId) {
						set({ submissionError: 'No active test session' })
						return false
					}

					set({ isSubmitting: true, submissionError: null })

					try {
						if (state.currentSection) {
							await saveSectionAndWait(state.currentSection)
						}
						if (state.currentSection === 'Writing') {
							await completeAttemptAndWait()
						}
						set({ isSubmitting: false })
						return true
					} catch (error) {
						console.error('Submit answers error:', error)
						set({
							isSubmitting: false,
							submissionError: error instanceof Error ? error.message : 'Submission failed',
						})
						return false
					}
				},

				exportAnswers: () => {
					const state = get()
					if (!state.currentUserId || !state.currentTestId) return null

					return {
						userId: state.currentUserId,
						testId: state.currentTestId,
						answers: state.answers,
						submittedAt: new Date().toISOString(),
					}
				},
			}),
			{
				name: 'ielts-exam-answers',
				storage: {
					getItem: name => {
						const value = sessionStorage.getItem(name)
						return value ? JSON.parse(value) : null
					},
					setItem: (name, value) => {
						sessionStorage.setItem(name, JSON.stringify(value))
					},
					removeItem: name => {
						sessionStorage.removeItem(name)
					},
				},
				partialize: state =>
					({
						currentUserId: state.currentUserId,
						currentTestId: state.currentTestId,
						answers: state.answers,
						currentSection: state.currentSection,
					} as Partial<AnswerStore> as AnswerStore),
			}
		),
		{
			name: 'ielts-exam-answers',
		}
	)
)
