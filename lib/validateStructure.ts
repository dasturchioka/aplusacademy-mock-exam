export interface ValidationResult {
	isValid: boolean
	errors: string[]
	warnings: string[]
}

export interface ListeningStructure {
	test: string
	section: string
	parts: Array<{
		part: number
		instructions: string
		questionsRange: string
		questions: Array<{
			questionId?: string
			number?: number
			numberRange?: string
			type: string
			text?: string
			questionText?: string
			headline?: string
			subHeadline?: string
			inputType?: string
			answerConstraints?: string
			isInteractive?: boolean
			answer?: {
				correct: string | string[]
				accepted: string[]
			}
			textList?: Array<{
				variant: string
				text: string
				isInteractive?: boolean
			}>
			options?: Array<{
				variant: string
				text: string
				isInteractive?: boolean
			}>
			url?: string
			base64?: string
			draggableVariants?: Array<{
				variant: string
				text: string
			}>
			topText?: string
			topInstructions?: string
			instructions?: string
		}>
	}>
}

export function validateListeningStructure(structure: any): ValidationResult {
	const errors: string[] = []
	const warnings: string[] = []

	if (!structure) {
		errors.push('Structure is required')
		return { isValid: false, errors, warnings }
	}

	// Test validation
	if (!structure.test) {
		errors.push('Test number is required')
	}

	// Section validation
	if (!structure.section) {
		errors.push('Section is required')
	} else if (structure.section !== 'Listening') {
		warnings.push('Section should be "Listening" for listening tests')
	}

	// Parts validation - IELTS specific: only 4 parts allowed
	if (!structure.parts || !Array.isArray(structure.parts)) {
		errors.push('Parts array is required')
	} else {
		if (structure.parts.length > 4) {
			errors.push('IELTS Listening tests can only have 4 parts maximum')
		}

		if (structure.parts.length === 0) {
			errors.push('At least one part is required')
		}

		// Validate each part
		structure.parts.forEach((part: any, partIndex: number) => {
			const partNumber = partIndex + 1

			// Part number validation
			if (!part.part || part.part !== partNumber) {
				errors.push(`Part ${partNumber}: part number should be ${partNumber}`)
			}

			// Instructions validation
			if (
				!part.instructions ||
				typeof part.instructions !== 'string' ||
				part.instructions.trim() === ''
			) {
				errors.push(`Part ${partNumber}: instructions are required`)
			}

			// Questions range validation
			if (!part.questionsRange || typeof part.questionsRange !== 'string') {
				errors.push(`Part ${partNumber}: questionsRange is required`)
			} else {
				// Validate range format (e.g., "1-10", "21-30")
				const rangeRegex = /^\d+(-\d+)?$/
				if (!rangeRegex.test(part.questionsRange)) {
					errors.push(
						`Part ${partNumber}: questionsRange must be in format "1-10" or single number`
					)
				}
			}

			// Questions array validation
			if (!part.questions || !Array.isArray(part.questions)) {
				errors.push(`Part ${partNumber}: questions array is required`)
			} else {
				// Validate each question
				part.questions.forEach((question: any, questionIndex: number) => {
					const questionPrefix = `Part ${partNumber}, Question ${questionIndex + 1}`

					// Question ID validation - IELTS specific format
					if (!question.questionId) {
						errors.push(`${questionPrefix}: questionId is required`)
					} else {
						const expectedFormat = /^listening-\d+-\d+-\d+(-\w+)?$/
						if (!expectedFormat.test(question.questionId)) {
							errors.push(
								`${questionPrefix}: questionId must follow format "listening-{test}-{part}-{number}"`
							)
						}
					}

					// Question type validation - IELTS specific types
					const validTypes = [
						'form-fill',
						'multiple-choice',
						'multi-select',
						'matching',
						'map-labelling',
						'short-answer',
						'sentence-completion',
					]

					if (!question.type) {
						errors.push(`${questionPrefix}: type is required`)
					} else if (!validTypes.includes(question.type)) {
						errors.push(`${questionPrefix}: type must be one of: ${validTypes.join(', ')}`)
					}

					// Number or numberRange validation
					if (!question.number && !question.numberRange) {
						errors.push(`${questionPrefix}: either number or numberRange is required`)
					}

					// Input type validation
					if (!question.inputType) {
						errors.push(`${questionPrefix}: inputType is required`)
					} else {
						const validInputTypes = ['text', 'radio', 'checkbox', 'drag']
						if (!validInputTypes.includes(question.inputType)) {
							errors.push(
								`${questionPrefix}: inputType must be one of: ${validInputTypes.join(', ')}`
							)
						}
					}

					// Answer constraints validation
					if (!question.answerConstraints) {
						warnings.push(`${questionPrefix}: answerConstraints should be provided for clarity`)
					}

					// Answer validation
					if (!question.answer) {
						errors.push(`${questionPrefix}: answer object is required`)
					} else {
						if (!question.answer.correct) {
							errors.push(`${questionPrefix}: answer.correct is required`)
						}

						if (!question.answer.accepted || !Array.isArray(question.answer.accepted)) {
							warnings.push(`${questionPrefix}: answer.accepted array should be provided`)
						}
					}

					// Type-specific validation
					switch (question.type) {
						case 'multi-select':
							if (!question.maxSelectableAnswers) {
								warnings.push(
									`${questionPrefix}: maxSelectableAnswers should be specified for multi-select questions`
								)
							}
							break

						case 'matching':
							if (!question.draggableVariants || !Array.isArray(question.draggableVariants)) {
								errors.push(
									`${questionPrefix}: draggableVariants array is required for matching questions`
								)
							}
							break

						case 'map-labelling':
							if (!question.url && !question.image) {
								warnings.push(
									`${questionPrefix}: map-labelling questions should have an image or URL`
								)
							}
							break

						case 'multiple-choice':
							if (!question.textList || !Array.isArray(question.textList)) {
								errors.push(
									`${questionPrefix}: textList array is required for multiple-choice questions`
								)
							}
							break
					}
				})
			}

			// Check for image/media in proper location
			if (part.image && part.questions.some((q: any) => q.url || q.image)) {
				warnings.push(
					`Part ${partNumber}: Images should be at part level, not duplicated per question`
				)
			}
		})
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	}
}

export function getValidationErrors(data: any): string[] {
	const errors: string[] = []

	if (!data.test) errors.push("Missing 'test' property")
	if (!data.section) errors.push("Missing 'section' property")
	if (data.section !== 'Listening') errors.push("Section must be 'Listening'")

	if (!Array.isArray(data.parts)) {
		errors.push('Parts must be an array')
	} else {
		if (data.parts.length === 0) errors.push('Parts array cannot be empty')
		if (data.parts.length > 4) errors.push('Parts array cannot have more than 4 parts')

		data.parts.forEach((part: any, index: number) => {
			if (!part.part) errors.push(`Part ${index + 1}: Missing 'part' number`)
			if (!part.instructions) errors.push(`Part ${index + 1}: Missing 'instructions'`)
			if (!part.questionsRange) errors.push(`Part ${index + 1}: Missing 'questionsRange'`)
			if (!Array.isArray(part.questions))
				errors.push(`Part ${index + 1}: Questions must be an array`)
		})
	}

	return errors
}
