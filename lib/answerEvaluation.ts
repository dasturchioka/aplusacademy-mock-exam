// Answer Evaluation Utilities for IELTS Mock Exam System
// Based on correct-answers-evaluation.md specification

import { LISTENING_SCORE_BANDS, READING_SCORE_BANDS } from '@/app/admin/results/[resultId]/page'

export type AnswerItem = {
	number: number | number[] // Support arrays of any length, not just pairs
	accepted: string[] | string[][]
	type?: 'multi-select-pair'
}

export type CorrectAnswerIndex = {
	[section: string]: {
		[number: string]: AnswerItem
	}
}

export type CorrectAnswersStructure = Array<{
	section: string
	answers: Array<{
		number: number | number[] // Support arrays of any length, not just pairs
		accepted: string[] | string[][]
		type?: 'multi-select-pair'
	}>
}>

/**
 * Unified answer normalization function for consistent comparison
 */
function normalizeAnswer(str: string): string {
	return str.trim().toLowerCase()
}

/**
 * Build an index from correct answers structure for fast lookup
 */
export function buildAnswerIndex(correctAnswers: CorrectAnswersStructure): CorrectAnswerIndex {
	const index: CorrectAnswerIndex = {}

	for (const sectionObj of correctAnswers) {
		const sectionName = sectionObj.section
		index[sectionName] = {}

		for (const answerItem of sectionObj.answers) {
			if (Array.isArray(answerItem.number)) {
				// Support arrays of any length, not just pairs
				for (const questionNum of answerItem.number) {
					index[sectionName][questionNum] = answerItem
				}
			} else {
				index[sectionName][answerItem.number] = answerItem
			}
		}
	}

	return index
}

/**
 * Check if a standard answer is correct (case-insensitive, trimmed)
 */
export function isStandardAnswerCorrect(userAnswer: string, accepted: string[]): boolean {
	const normalizedUserAnswer = normalizeAnswer(userAnswer)
	return accepted.some(acceptedAnswer => normalizeAnswer(acceptedAnswer) === normalizedUserAnswer)
}

/**
 * Check multi-select pair questions for any number of questions (N questions)
 */
export function checkMultiSelectPair(
	questionNumbers: number[],
	userAnswers: Record<number, string>,
	acceptedPairs: string[][]
): Record<number, boolean> {
	// Get all user answers for the question group
	const userAnswerArray = questionNumbers.map(qNum => normalizeAnswer(userAnswers[qNum] || ''))

	// If any answer is missing, mark all as false
	if (userAnswerArray.some(answer => !answer) || !acceptedPairs || acceptedPairs.length === 0) {
		const result: Record<number, boolean> = {}
		questionNumbers.forEach(qNum => {
			result[qNum] = false
		})
		return result
	}

	// Check if user's answers match any of the accepted answer sets
	let perfectMatch = false
	for (const acceptedSet of acceptedPairs) {
		if (acceptedSet.length !== questionNumbers.length) continue

		// Normalize accepted answers
		const normalizedAccepted = acceptedSet.map(ans => normalizeAnswer(ans))

		// Check if user answers match this accepted set (order doesn't matter)
		const userSet = new Set(userAnswerArray)
		const acceptedSetNormalized = new Set(normalizedAccepted)

		if (
			userSet.size === acceptedSetNormalized.size &&
			[...userSet].every(answer => acceptedSetNormalized.has(answer))
		) {
			perfectMatch = true
			break
		}
	}

	// Build result object
	const result: Record<number, boolean> = {}

	if (perfectMatch) {
		// If perfect match, all answers are correct
		questionNumbers.forEach(qNum => {
			result[qNum] = true
		})
	} else {
		// If no perfect match, check each answer individually
		questionNumbers.forEach((qNum, index) => {
			const userAnswer = userAnswerArray[index]
			let individualCorrect = false

			// Check if this individual answer exists in any accepted set
			for (const acceptedSet of acceptedPairs) {
				const normalizedAccepted = acceptedSet.map(ans => normalizeAnswer(ans))
				if (normalizedAccepted.includes(userAnswer)) {
					individualCorrect = true
					break
				}
			}

			result[qNum] = individualCorrect
		})
	}

	return result
}

/**
 * Enhanced multi-select pair evaluation for N questions (from specification)
 */
export function evaluateMultiSelectPair(
	entry: AnswerItem,
	userAnswers: Record<number, string>
): Record<number, boolean> {
	if (!Array.isArray(entry.number) || !entry.accepted || entry.type !== 'multi-select-pair') {
		return {}
	}

	const questionNumbers = entry.number
	const allAnswersProvided = questionNumbers.every(qNum => {
		const answer = normalizeAnswer(userAnswers[qNum] || '')
		return !!answer
	})

	if (!allAnswersProvided) {
		const result: Record<number, boolean> = {}
		questionNumbers.forEach(qNum => {
			result[qNum] = false
		})
		return result
	}

	// Use the updated checkMultiSelectPair function with all accepted pairs
	return checkMultiSelectPair(questionNumbers, userAnswers, entry.accepted as string[][])
}

/**
 * Main evaluation function for user answers
 */
export function evaluateUserAnswers(
	correctAnswers: CorrectAnswersStructure,
	userAnswers: Record<number, string>,
	targetSection: string
): Record<number, boolean> {
	const index = buildAnswerIndex(correctAnswers)
	const result: Record<number, boolean> = {}

	const sectionIndex = index[targetSection]
	if (!sectionIndex) return result

	// Keep track of processed multi-select pairs to avoid duplicate evaluation
	const processedPairs = new Set<string>()

	for (const qNumStr in sectionIndex) {
		const qNum = Number(qNumStr)
		const item = sectionIndex[qNumStr]

		if (item.type === 'multi-select-pair' && Array.isArray(item.number)) {
			// Create a unique key for this pair group
			const pairKey = item.number.sort().join('-')

			// Only evaluate once per pair group
			if (processedPairs.has(pairKey)) continue
			processedPairs.add(pairKey)

			const pairResult = evaluateMultiSelectPair(item, userAnswers)

			// Apply results to all questions in the group
			item.number.forEach(questionNum => {
				result[questionNum] = pairResult[questionNum]
			})
		} else {
			const userAns = userAnswers[qNum]
			if (userAns !== undefined) {
				result[qNum] = isStandardAnswerCorrect(userAns, item.accepted as string[])
			} else {
				result[qNum] = false
			}
		}
	}

	return result
}

/**
 * Utility function to check a single answer
 */
export function checkAnswer(
	questionNumber: number,
	userAnswer: string,
	correctAnswers: CorrectAnswersStructure,
	sectionName: string = 'Listening'
): boolean {
	const index = buildAnswerIndex(correctAnswers)
	const item = index[sectionName]?.[questionNumber]

	if (!item) return false

	if (item.type === 'multi-select-pair') {
		// For multi-select pairs, we need all answers in the group
		return false // Cannot evaluate single answer from a pair group
	}

	return isStandardAnswerCorrect(userAnswer, item.accepted as string[])
}

/**
 * Utility function to check pair answers specifically (supports N questions)
 */
export function checkPairAnswers(
	questionNumbers: number[],
	userAnswers: Record<number, string>,
	correctAnswers: CorrectAnswersStructure,
	sectionName: string = 'Listening'
): { [key: number]: boolean } {
	const index = buildAnswerIndex(correctAnswers)
	const item = index[sectionName]?.[questionNumbers[0]]

	if (!item || item.type !== 'multi-select-pair') {
		const result: Record<number, boolean> = {}
		questionNumbers.forEach(qNum => {
			result[qNum] = false
		})
		return result
	}

	return evaluateMultiSelectPair(item, userAnswers)
}

/**
 * Calculate section score based on correct answers
 */
export function calculateSectionScore(
	correctAnswers: CorrectAnswersStructure,
	userAnswers: Record<number, string>,
	sectionName: string
): { correct: number; total: number; percentage: number } {
	const evaluationResult = evaluateUserAnswers(correctAnswers, userAnswers, sectionName)

	const correct = Object.values(evaluationResult).filter(isCorrect => isCorrect).length
	const total = Object.keys(evaluationResult).length
	const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

	return { correct, total, percentage }
}

/**
 * Get the IELTS band score based on correct answers
 */
export function getIELTSBandScore(correct: number, sectionName: string): number {
	const bands = sectionName === 'Listening' ? LISTENING_SCORE_BANDS : READING_SCORE_BANDS

	for (const band of bands) {
		if (correct >= band.min && correct <= band.max) {
			return band.band
		}
	}

	return 1.0 // Minimum band score
}

/**
 * Get correct answer for display (supports N questions in multi-select pairs)
 */
export function getCorrectAnswerForDisplay(
	questionNumber: number,
	correctAnswers: CorrectAnswersStructure,
	sectionName: string
): string | null {
	const index = buildAnswerIndex(correctAnswers)
	const item = index[sectionName]?.[questionNumber]

	if (!item) return null

	if (
		item.type === 'multi-select-pair' &&
		Array.isArray(item.accepted) &&
		Array.isArray(item.accepted[0])
	) {
		// For multi-select pairs, show all questions in the group with their accepted answers
		const acceptedSets = item.accepted as string[][]

		// Show the first accepted set as example, but indicate it's one of multiple valid combinations
		if (acceptedSets.length > 0) {
			const firstSet = acceptedSets[0]
			const formattedAnswers = firstSet.map(ans => `"${ans}"`).join(', ')

			if (acceptedSets.length > 1) {
				return `${formattedAnswers} (one valid combination of ${acceptedSets.length})`
			} else {
				return formattedAnswers
			}
		}

		return 'Multiple valid combinations'
	} else {
		// For standard questions, show all accepted answers
		const accepted = item.accepted as string[]
		if (accepted.length === 1) {
			return `"${accepted[0]}"`
		} else {
			return accepted.map(ans => `"${ans}"`).join(' or ')
		}
	}
}

/**
 * Check if a question is part of a multi-select pair and get its pair info (supports N questions)
 */
export function getMultiSelectPairInfo(
	questionNumber: number,
	correctAnswers: CorrectAnswersStructure,
	sectionName: string
): { isPair: boolean; pairQuestions?: number[]; acceptedPairs?: string[][] } {
	const index = buildAnswerIndex(correctAnswers)
	const item = index[sectionName]?.[questionNumber]

	if (!item || item.type !== 'multi-select-pair' || !Array.isArray(item.number)) {
		return { isPair: false }
	}

	return {
		isPair: true,
		pairQuestions: item.number,
		acceptedPairs: item.accepted as string[][],
	}
}

/**
 * Get the type of a question based on question number and correct answers structure
 */
export function getQuestionType(
	questionNumber: number,
	correctAnswers: CorrectAnswersStructure,
	sectionName: string
): string {
	const index = buildAnswerIndex(correctAnswers)
	const item = index[sectionName]?.[questionNumber]

	if (!item) return 'unknown'

	// Return the type if specified, otherwise 'standard'
	return item.type || 'standard'
}
