import defaultInstance from '@/http'
import { AnswerStorage } from './answerHandlers'
import { retryWithBackoff } from './retryUtil'

interface SectionResult {
	[sectionName: string]: Array<
		| { [questionNumber: string]: string; isCorrect: null | any }
		| { report?: string; essay?: string }
	>
}

interface CreateResultRequest {
	exam_taker_id: string
	test_id: string
	results: SectionResult[]
}

interface UpdateResultRequest {
	results: SectionResult[]
}

export class SectionCompletion {
	/**
	 * Complete a section - creates new result or updates existing one
	 */
	static async completeSection(
		section: 'Listening' | 'Reading' | 'Writing'
	): Promise<{ success: boolean; resultId?: string; error?: string }> {
		try {
			const session = AnswerStorage.getTestSession()
			if (!session) {
				throw new Error('No active test session found')
			}

			// Get answers for this section
			const sectionAnswers = AnswerStorage.getAnswers(section)

			// Format answers according to strict schema
			const formattedSectionData = this.formatSectionAnswers(section, sectionAnswers)

			// Check if this is the first section (no result ID exists)
			const existingResultId = AnswerStorage.getResultId()
			console.log(`🔍 Section ${section} - Existing result ID:`, existingResultId)

			if (!existingResultId) {
				// Create new result record
				return await this.createNewResult(
					session.userId,
					session.testId,
					section,
					formattedSectionData
				)
			} else {
				// Update existing result record
				return await this.updateExistingResult(existingResultId, section, formattedSectionData)
			}
		} catch (error) {
			console.error(`Error completing ${section} section:`, error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error occurred',
			}
		} finally {
			// If Writing section was completed successfully, delete exam entry approval
			if (section === 'Writing') {
				try {
					const session = AnswerStorage.getTestSession()
					if (session?.userId) {
						console.log('🗑️ Deleting exam entry approval for completed Writing section...')
						await defaultInstance.delete(`/api/exam-entry-approvals/${session.userId}`)
						console.log('✅ Exam entry approval deleted successfully')
					}
				} catch (approvalError) {
					console.warn('Failed to delete exam entry approval:', approvalError)
					// Don't fail the whole operation if approval deletion fails
				}
			}
		}
	}

	/**
	 * Create new result record (for first section completion)
	 */
	private static async createNewResult(
		userId: string,
		testId: string,
		section: 'Listening' | 'Reading' | 'Writing',
		sectionData: SectionResult
	): Promise<{ success: boolean; resultId?: string; error?: string }> {
		try {
			console.log(`🆕 Creating new result for ${section} section`)

			const requestData: CreateResultRequest = {
				exam_taker_id: userId,
				test_id: testId,
				results: [sectionData],
			}

			// Wrap API call in retry logic with increased attempts for maximum reliability
			const response = await retryWithBackoff(
				async () => {
					const res = await defaultInstance.post('/api/results/create', requestData)
					
					if (!res.data.success) {
						throw new Error(res.data.error || 'Failed to create result')
					}
					
					return res;
				},
				{
					maxRetries: 5, // 5 retry attempts for critical data saving
					initialDelay: 1000,
					onRetry: (attempt, error) => {
						console.log(`🔄 [${section}] Retrying create result... Attempt ${attempt}/5`, error?.message);
					},
				}
			);

			const resultId = response.data.resultId
			console.log(`📊 Server response:`, response.data)
			console.log(`📦 Result ID extracted:`, resultId)

			// Store result ID for subsequent sections
			AnswerStorage.setResultId(resultId)

			// Verify storage
			const storedId = AnswerStorage.getResultId()
			console.log(`💾 Stored result ID verification:`, storedId)

			console.log(`✅ Created result with ID: ${resultId}`)

			return {
				success: true,
				resultId: resultId,
			}
		} catch (error) {
			console.error('❌ Error creating new result after retries:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to create result',
			}
		}
	}

	/**
	 * Update existing result record (for subsequent sections)
	 */
	private static async updateExistingResult(
		resultId: string,
		section: 'Listening' | 'Reading' | 'Writing',
		sectionData: SectionResult
	): Promise<{ success: boolean; resultId?: string; error?: string }> {
		try {
			console.log(`📝 Updating existing result ${resultId} with ${section} section`)

			// Wrap the entire update operation in retry logic with increased attempts
			await retryWithBackoff(
				async () => {
					// First, fetch current results to merge with new section
					console.log(`🔍 [${section}] Fetching result from: /api/results/${resultId}`)
					const fetchResponse = await defaultInstance.get(`/api/results/${resultId}`)
					console.log(`📊 [${section}] Fetch response:`, fetchResponse.data)

					if (!fetchResponse.data.success) {
						throw new Error('Failed to fetch current results')
					}

					const currentResults = fetchResponse.data.result?.results || []
					console.log(`📋 [${section}] Current results found:`, currentResults)

					// Remove any existing entry for this section and add new one
					const filteredResults = currentResults.filter((result: SectionResult) => !result[section])
					const updatedResults = [...filteredResults, sectionData]

					const requestData: UpdateResultRequest = {
						results: updatedResults,
					}

					const updateResponse = await defaultInstance.put(`/api/results/${resultId}`, requestData)

					if (!updateResponse.data.success) {
						throw new Error(updateResponse.data.error || 'Failed to update result')
					}

					return updateResponse;
				},
				{
					maxRetries: 5, // 5 retry attempts for critical data saving
					initialDelay: 1000,
					onRetry: (attempt, error) => {
						console.log(`🔄 [${section}] Retrying update result... Attempt ${attempt}/5`, error?.message);
					},
				}
			);

			console.log(`✅ Updated result ${resultId} with ${section} data`)

			return {
				success: true,
				resultId: resultId,
			}
		} catch (error) {
			console.error('❌ Error updating existing result after retries:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to update result',
			}
		}
	}

	/**
	 * Format section answers to match strict JSONB schema
	 */
	private static formatSectionAnswers(
		section: 'Listening' | 'Reading' | 'Writing',
		answers: Record<string, string>
	): SectionResult {
		if (section === 'Writing') {
			// Writing format: [{ report: "..." }, { essay: "..." }]
			return {
				[section]: [{ report: answers.report || '' }, { essay: answers.essay || '' }],
			}
		} else {
			// Listening/Reading format: [{ "1": "answer", isCorrect: null }, ...]
			// Convert to new array format and sort by question number
			const formattedAnswers = Object.entries(answers)
				.filter(([questionNum, answer]) => answer && answer.trim()) // Only include non-empty answers
				.sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort by question number
				.map(([questionNum, answer]) => ({
					[questionNum]: answer,
					isCorrect: null as any,
				} as { [questionNumber: string]: string; isCorrect: null | any }))

			console.log(`📋 Formatted ${section} answers:`, formattedAnswers)

			return {
				[section]: formattedAnswers,
			} as SectionResult
		}
	}

	/**
	 * Get completion status for a section
	 */
	static getSectionStatus(section: 'Listening' | 'Reading' | 'Writing'): {
		hasAnswers: boolean
		answerCount: number
		answers: Record<string, string>
	} {
		const answers = AnswerStorage.getAnswers(section)
		const answerCount = Object.keys(answers).filter(key => answers[key]?.trim()).length

		return {
			hasAnswers: answerCount > 0,
			answerCount,
			answers,
		}
	}

	/**
	 * Clear section data (useful for retaking)
	 */
	static clearSection(section: 'Listening' | 'Reading' | 'Writing'): void {
		AnswerStorage.clearSection(section)
		console.log(`🗑️ Cleared ${section} section data`)
	}

	/**
	 * Initialize new test session
	 */
	static initializeTestSession(userId: string, testId: string): void {
		// Clear any previous session data
		AnswerStorage.clearAll()

		// Set new session
		AnswerStorage.setTestSession(userId, testId)

		console.log(`🚀 Initialized test session for user ${userId}, test ${testId}`)
	}

	/**
	 * Get current test session info
	 */
	static getSessionInfo(): {
		session: any
		resultId: string | null
		completedSections: string[]
	} {
		const session = AnswerStorage.getTestSession()
		const resultId = AnswerStorage.getResultId()

		const completedSections: string[] | any = []
		if (
			AnswerStorage.getAnswers('Listening') &&
			Object.keys(AnswerStorage.getAnswers('Listening')).length > 0
		) {
			completedSections.push('Listening')
		}
		if (
			AnswerStorage.getAnswers('Reading') &&
			Object.keys(AnswerStorage.getAnswers('Reading')).length > 0
		) {
			completedSections.push('Reading')
		}
		if (
			AnswerStorage.getAnswers('Writing') &&
			Object.keys(AnswerStorage.getAnswers('Writing')).length > 0
		) {
			completedSections.push('Writing')
		}

		return {
			session,
			resultId,
			completedSections,
		}
	}
}
