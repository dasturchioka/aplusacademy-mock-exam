/**
 * Utility functions for admin panel question numbering and type handling
 */

export interface AdminQuestion {
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
}

export interface AdminPart {
	part: number
	instructions: string
	questionsRange: string
	questions: AdminQuestion[]
}

/**
 * Calculate correct question number based on part and position
 */
export function calculateQuestionNumber(partNumber: number, positionInPart: number): number {
	const partStartNumber = (partNumber - 1) * 10 + 1
	return partStartNumber + positionInPart - 1
}

/**
 * Get question number range for a part (e.g., "1-10", "11-20")
 */
export function getPartQuestionRange(partNumber: number): string {
	const startNumber = (partNumber - 1) * 10 + 1
	const endNumber = partNumber * 10
	return `${startNumber}-${endNumber}`
}

/**
 * Check if a question type should be interactive
 */
export function shouldQuestionBeInteractive(questionType: string): boolean {
	const nonInteractiveTypes = ['static', 'divider', 'image']
	return !nonInteractiveTypes.includes(questionType)
}

/**
 * Get default question number for a new question in admin
 */
export function getDefaultQuestionNumber(
	partNumber: number,
	questions: AdminQuestion[],
	insertPosition?: number
): number | undefined {
	const interactiveQuestions = questions.filter(q => shouldQuestionBeInteractive(q.type))

	if (insertPosition !== undefined) {
		const interactivesBefore = questions
			.slice(0, insertPosition)
			.filter(q => shouldQuestionBeInteractive(q.type))
		const positionInPart = interactivesBefore.length + 1
		return calculateQuestionNumber(partNumber, positionInPart)
	}

	const nextPosition = interactiveQuestions.length + 1
	return calculateQuestionNumber(partNumber, nextPosition)
}

/**
 * Auto-fix question numbering for admin panel
 */
export function fixAdminQuestionNumbering(parts: AdminPart[]): AdminPart[] {
	return parts.map(part => {
		let interactiveQuestionCount = 0

		const fixedQuestions = part.questions.map(question => {
			// Ensure isInteractive is set correctly
			const isInteractive = shouldQuestionBeInteractive(question.type)

			if (isInteractive) {
				interactiveQuestionCount++
				const correctNumber = calculateQuestionNumber(part.part, interactiveQuestionCount)

				return {
					...question,
					isInteractive: true,
					number: correctNumber
				}
			} else {
				// Non-interactive elements shouldn't have numbers
				return {
					...question,
					isInteractive: false,
					number: undefined,
					numberRange: undefined
				}
			}
		})

		// Update part range based on actual interactive questions
		const partRange = getPartQuestionRange(part.part)

		return {
			...part,
			questions: fixedQuestions,
			questionsRange: partRange
		}
	})
}

/**
 * Get question type specific default fields for admin
 */
export function getQuestionTypeDefaults(type: string): Partial<AdminQuestion> {
	const defaults: Record<string, Partial<AdminQuestion>> = {
		'form-fill': {
			text: 'Complete the sentence: ____',
			inputType: 'text',
			answerConstraints: 'ONE WORD AND/OR A NUMBER',
			isInteractive: true
		},
		'multiple-choice': {
			questionText: 'What does the speaker say?',
			inputType: 'radio',
			answerConstraints: 'CHOOSE THE CORRECT LETTER A, B OR C',
			isInteractive: true,
			textList: [
				{ variant: 'A', text: '', isInteractive: true },
				{ variant: 'B', text: '', isInteractive: true },
				{ variant: 'C', text: '', isInteractive: true }
			]
		},
		'multi-select': {
			questionText: 'Which TWO statements are mentioned?',
			inputType: 'checkbox',
			answerConstraints: 'CHOOSE TWO LETTERS A-E',
			isInteractive: true,
			options: [
				{ variant: 'A', text: '', isInteractive: true },
				{ variant: 'B', text: '', isInteractive: true },
				{ variant: 'C', text: '', isInteractive: true },
				{ variant: 'D', text: '', isInteractive: true },
				{ variant: 'E', text: '', isInteractive: true }
			]
		},
		'matching': {
			text: 'Match the item: ____',
			inputType: 'drag',
			answerConstraints: 'CHOOSE FROM A-H',
			isInteractive: true
		},
		'map-labelling': {
			text: 'Label the location: ____',
			inputType: 'text',
			answerConstraints: 'CHOOSE THE CORRECT LETTER A-H',
			isInteractive: true
		},
		'short-answer': {
			text: 'What is mentioned?',
			inputType: 'text',
			answerConstraints: 'NO MORE THAN THREE WORDS',
			isInteractive: true
		},
		'sentence-completion': {
			text: 'Complete the sentence: ____',
			inputType: 'text',
			answerConstraints: 'ONE WORD ONLY',
			isInteractive: true
		},
		'divider': {
			topText: 'Questions 1-5',
			topInstructions: 'Listen to the recording and answer the questions.',
			instructions: 'Choose the correct answer from the options below.',
			isInteractive: false
		},
		'image': {
			headline: 'Diagram/Map',
			isInteractive: false
		},
		'static': {
			text: 'Instructional text goes here.',
			isInteractive: false
		}
	}

	return defaults[type] || { isInteractive: true }
}

/**
 * Get admin UI fields configuration for each question type
 */
export function getAdminUIFields(type: string): Array<{
	field: string
	label: string
	type: 'text' | 'textarea' | 'number' | 'options' | 'image'
	required?: boolean
}> {
	const fieldConfigs: Record<string, any[]> = {
		'form-fill': [
			{ field: 'text', label: 'Sentence with blank (use ____)', type: 'textarea', required: true },
			{ field: 'answerConstraints', label: 'Answer constraints', type: 'text' },
			{ field: 'inputType', label: 'Input type', type: 'text' }
		],
		'multiple-choice': [
			{ field: 'questionText', label: 'Question text', type: 'textarea', required: true },
			{ field: 'textList', label: 'Options (A, B, C...)', type: 'options', required: true },
			{ field: 'answerConstraints', label: 'Answer constraints', type: 'text' }
		],
		'multi-select': [
			{ field: 'questionText', label: 'Question text', type: 'textarea', required: true },
			{ field: 'options', label: 'Options (A-E)', type: 'options', required: true },
			{ field: 'answerConstraints', label: 'Answer constraints', type: 'text' }
		],
		'map-labelling': [
			{ field: 'text', label: 'Label text', type: 'textarea', required: true },
			{ field: 'url', label: 'Map/Diagram image', type: 'image', required: true },
			{ field: 'answerConstraints', label: 'Answer constraints', type: 'text' }
		],
		'matching': [
			{ field: 'text', label: 'Item to match', type: 'textarea', required: true },
			{ field: 'answerConstraints', label: 'Answer constraints', type: 'text' }
		],
		'sentence-completion': [
			{ field: 'text', label: 'Sentence with gap (use ____)', type: 'textarea', required: true },
			{ field: 'answerConstraints', label: 'Word/character limit', type: 'text' }
		],
		'short-answer': [
			{ field: 'text', label: 'Question text', type: 'textarea', required: true },
			{ field: 'answerConstraints', label: 'Word limit', type: 'text' }
		],
		'divider': [
			{ field: 'topText', label: 'Top text (e.g., "Questions 1-10")', type: 'text' },
			{ field: 'topInstructions', label: 'Instructions', type: 'textarea' },
			{ field: 'instructions', label: 'Additional instructions', type: 'textarea' }
		],
		'image': [
			{ field: 'headline', label: 'Image caption/title', type: 'text' },
			{ field: 'url', label: 'Image', type: 'image', required: true }
		],
		'static': [
			{ field: 'text', label: 'Static text content', type: 'textarea', required: true }
		]
	}

	return fieldConfigs[type] || []
}

/**
 * Validate admin question structure
 */
export function validateAdminQuestion(question: AdminQuestion): string[] {
	const errors: string[] = []
	const fields = getAdminUIFields(question.type)

	fields.forEach(fieldConfig => {
		if (fieldConfig.required && !question[fieldConfig.field as keyof AdminQuestion]) {
			errors.push(`${fieldConfig.label} is required for ${question.type}`)
		}
	})

	// Type-specific validation
	if (question.type === 'multiple-choice' && (!question.textList || question.textList.length < 2)) {
		errors.push('Multiple choice questions need at least 2 options')
	}

	if (question.type === 'multi-select' && (!question.options || question.options.length < 3)) {
		errors.push('Multi-select questions need at least 3 options')
	}

	return errors
}

/**
 * Generate question report for admin debugging
 */
export function generateAdminQuestionReport(parts: AdminPart[]): string {
	let report = '📊 Admin Panel Question Report\n\n'

	parts.forEach(part => {
		const interactive = part.questions.filter(q => shouldQuestionBeInteractive(q.type))
		const nonInteractive = part.questions.filter(q => !shouldQuestionBeInteractive(q.type))

		report += `Part ${part.part} (${part.questionsRange}):\n`
		report += `  Interactive questions: ${interactive.length}\n`
		report += `  Non-interactive elements: ${nonInteractive.length}\n`

		// Show number sequence
		const numbers = interactive.map(q => q.number).join(', ')
		report += `  Numbers: [${numbers}]\n`

		// Show validation issues
		part.questions.forEach((q, index) => {
			const errors = validateAdminQuestion(q)
			if (errors.length > 0) {
				report += `  ⚠️ Q${index + 1} (${q.type}): ${errors.join(', ')}\n`
			}
		})

		report += '\n'
	})

	const totalInteractive = parts.reduce((sum, part) =>
		sum + part.questions.filter(q => shouldQuestionBeInteractive(q.type)).length, 0
	)

	report += `Total interactive questions: ${totalInteractive}/40\n`

	if (totalInteractive !== 40) {
		report += '⚠️ Warning: IELTS Listening should have exactly 40 questions!\n'
	}

	return report
}