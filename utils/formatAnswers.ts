export interface FormattedAnswer {
	[questionNumber: string]: string | null
	isCorrect: null | any
}

export interface WritingAnswer {
	report?: string
	essay?: string
}

export interface FormattedSection {
	[sectionName: string]: (FormattedAnswer | WritingAnswer)[]
}

/**
 * Format answers for Listening or Reading sections
 * Converts { number, answer } array to strict format
 */
export function formatListeningOrReading(
	sectionName: 'Listening' | 'Reading',
	answers: { number: number; answer: string }[]
): FormattedSection {
	return {
		[sectionName]: answers.map(a => ({
			[a.number]: a.answer,
			isCorrect: null,
		})),
	}
}

/**
 * Format Writing answers to strict format
 */
export function formatWriting(report: string, essay: string): FormattedSection {
	return {
		Writing: [{ report }, { essay }],
	}
}

/**
 * Convert current answer store format to consistent format for saving
 */
export function convertAnswersToFormat(
	section: 'Listening' | 'Reading',
	answers: Record<string, string>
): { number: number; answer: string }[] {
	return Object.entries(answers).map(([questionNum, answer]) => ({
		number: parseInt(questionNum),
		answer: answer || '',
	}))
}

/**
 * Convert writing answers from store format
 */
export function convertWritingAnswers(writingAnswers: {
	report?: string
	essay?: string
}): WritingAnswer {
	return {
		report: writingAnswers.report || '',
		essay: writingAnswers.essay || '',
	}
}

/**
 * Merge new section result with existing results array
 * Filters out previous instances of the same section and adds new one
 */
export function mergeResults(
	previousResults: FormattedSection[],
	newSectionResult: FormattedSection
): FormattedSection[] {
	const sectionName = Object.keys(newSectionResult)[0]

	// Remove any existing entry for this section
	const filteredResults = previousResults.filter(result => !result[sectionName])

	// Add the new section result
	return [...filteredResults, newSectionResult]
}
