/**
 * Utility functions for the new questionId system
 * Format: {section}-{part}-{questionOrder}
 * Examples: listening-1-2, reading-1-16
 */

export interface QuestionWithId {
	questionId: string
	questionNumber: number
	[key: string]: any
}

/**
 * Generate questionId with format: {section}-{part}-{questionOrder}
 * @param section - 'listening' or 'reading'
 * @param part - part number (1-4)
 * @param questionOrder - sequential question number within the section (1-40)
 */
export function generateQuestionId(
	section: 'listening' | 'reading',
	part: number,
	questionOrder: number
): string {
	return `${section}-${part}-${questionOrder}`
}

/**
 * Calculate question order based on part and position within part
 * For listening/reading: each section has 40 questions total
 * Part 1: questions 1-10, Part 2: questions 11-20, etc.
 */
export function calculateQuestionOrder(part: number, positionInPart: number): number {
	const partStartNumber = (part - 1) * 10 + 1
	return partStartNumber + positionInPart - 1
}

/**
 * Calculate which part a question belongs to based on its order
 */
export function getPartFromQuestionOrder(questionOrder: number): number {
	return Math.ceil(questionOrder / 10)
}

/**
 * Get the position within a part for a given question order
 */
export function getPositionInPart(questionOrder: number): number {
	return ((questionOrder - 1) % 10) + 1
}

/**
 * Generate questionId and questionNumber for a question based on section, part, and position
 */
export function generateQuestionData(
	section: 'listening' | 'reading',
	part: number,
	positionInPart: number
): { questionId: string; questionNumber: number } {
	const questionNumber = calculateQuestionOrder(part, positionInPart)
	const questionId = generateQuestionId(section, part, questionNumber)

	return { questionId, questionNumber }
}

/**
 * Count total questions in a section across all parts
 */
export function countSectionQuestions(parts: any[]): number {
	return parts.reduce((total, part) => {
		if (part.questionBlocks) {
			return total + countPartQuestions(part.questionBlocks)
		}
		return total
	}, 0)
}

/**
 * Count questions in a specific part
 */
export function countPartQuestions(questionBlocks: any[]): number {
	return questionBlocks.reduce((total, block) => {
		if (block.questions && Array.isArray(block.questions)) {
			return total + block.questions.filter((q: any) => q.isInteractive !== false).length
		}
		return total + 1
	}, 0)
}

/**
 * Auto-generate questionIds for all questions in a section
 */
export function generateSectionQuestionIds(section: 'listening' | 'reading', parts: any[]): any[] {
	let questionOrder = 1

	return parts.map((part, partIndex) => {
		const updatedPart = { ...part }

		if (part.questionBlocks) {
			updatedPart.questionBlocks = part.questionBlocks.map((block: any) => {
				const updatedBlock = { ...block }

				if (block.questions && Array.isArray(block.questions)) {
					updatedBlock.questions = block.questions.map((question: any) => {
						if (question.isInteractive !== false) {
							const { questionId, questionNumber } = generateQuestionData(
								section,
								partIndex + 1,
								getPositionInPart(questionOrder)
							)

							questionOrder++

							return {
								...question,
								questionId,
								questionNumber,
							}
						}
						return question
					})
				} else {
					// For blocks without questions array (like single question blocks)
					if (block.isInteractive !== false) {
						const { questionId, questionNumber } = generateQuestionData(
							section,
							partIndex + 1,
							getPositionInPart(questionOrder)
						)

						questionOrder++

						updatedBlock.questionId = questionId
						updatedBlock.questionNumber = questionNumber
					}
				}

				return updatedBlock
			})
		}

		return updatedPart
	})
}

/**
 * Validate that a section doesn't exceed 40 questions
 */
export function validateSectionQuestionCount(
	section: 'listening' | 'reading',
	parts: any[]
): { isValid: boolean; count: number; error?: string } {
	const count = countSectionQuestions(parts)
	const maxQuestions = 40

	if (count > maxQuestions) {
		return {
			isValid: false,
			count,
			error: `${section} section has ${count} questions. Maximum allowed is ${maxQuestions}.`,
		}
	}

	return { isValid: true, count }
}
