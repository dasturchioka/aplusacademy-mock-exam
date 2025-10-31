import defaultInstance from '@/http'
import { FormattedSection, mergeResults } from '@/utils/formatAnswers'
import { retryWithBackoff } from './retryUtil'

export interface SaveSectionParams {
	examTakerId: string
	testId: string
	section: 'Listening' | 'Reading' | 'Writing'
	formattedResult: FormattedSection
}

/**
 * Save section result immediately to Supabase with retry logic
 * Merges with existing results to avoid overwriting other sections
 */
export async function saveSectionResult({
	examTakerId,
	testId,
	section,
	formattedResult,
}: SaveSectionParams): Promise<{ success: boolean; error?: string }> {
	try {
		// Wrap the entire save operation in retry logic
		await retryWithBackoff(
			async () => {
				// First, fetch any existing result for this user/test combination
				const fetchResponse = await defaultInstance.get('/api/results', {
					headers: {
						exam_taker_id: examTakerId,
						test_id: testId,
					},
				})

				let previousResults: FormattedSection[] = []

				if (fetchResponse.data?.success && fetchResponse.data?.result?.results) {
					previousResults = fetchResponse.data.result.results
				}

				// Merge new section with existing results
				const mergedResults = mergeResults(previousResults, formattedResult)

				// Save merged results back to database
				const saveResponse = await defaultInstance.post(
					'/api/results',
					{
						results: mergedResults,
					},
					{
						headers: {
							exam_taker_id: examTakerId,
							test_id: testId,
							'Content-Type': 'application/json',
						},
					}
				)

				if (!saveResponse.data?.success) {
					throw new Error(saveResponse.data?.error || 'Failed to save section result')
				}

				return saveResponse;
			},
			{
				maxRetries: 5, // 5 retry attempts for critical data saving
				initialDelay: 1000,
				onRetry: (attempt, error) => {
					console.log(`🔄 [${section}] Retrying save... Attempt ${attempt}/5`, error?.message || error);
				},
			}
		);

		return { success: true }
	} catch (error) {
		console.error(`Error saving ${section} section result after retries:`, error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		}
	}
}

/**
 * Helper function to save Listening section
 */
export async function saveListeningSection(
	examTakerId: string,
	testId: string,
	answers: { number: number; answer: string }[]
) {
	const formattedResult: FormattedSection = {
		Listening: answers.map(a => ({
			[a.number]: a.answer,
			isCorrect: null as any,
		})),
	}

	return saveSectionResult({
		examTakerId,
		testId,
		section: 'Listening',
		formattedResult,
	})
}

/**
 * Helper function to save Reading section
 */
export async function saveReadingSection(
	examTakerId: string,
	testId: string,
	answers: { number: number; answer: string }[]
) {
	const formattedResult: FormattedSection = {
		Reading: answers.map(a => ({
			[a.number]: a.answer,
			isCorrect: null as any,
		})),
	}

	return saveSectionResult({
		examTakerId,
		testId,
		section: 'Reading',
		formattedResult,
	})
}

/**
 * Helper function to save Writing section
 */
export async function saveWritingSection(
	examTakerId: string,
	testId: string,
	report: string,
	essay: string
) {
	const formattedResult: FormattedSection = {
		Writing: [{ report }, { essay }],
	}

	return saveSectionResult({
		examTakerId,
		testId,
		section: 'Writing',
		formattedResult,
	})
}
