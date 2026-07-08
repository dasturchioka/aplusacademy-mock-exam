import { v4 as uuidv4 } from 'uuid'

export interface QuestionRange {
	start: number
	end: number
	count: number
}

export interface QuestionMetadata {
	questionId: string
	test: string
	section: string
	part: number
	number?: number
	numberRange?: string
}

/**
 * Generate a consistent questionId for a question
 */
export function generateQuestionId(
	test: string,
	section: string,
	part: number,
	number?: number,
	suffix?: string
): string {
	// Add validation for undefined parameters
	const safeTest = test || '1'
	const safeSection = section || 'listening'
	const safePart = part || 1

	const baseId = `${safeSection.toLowerCase()}-${safeTest}-${safePart}`
	if (number) {
		return `${baseId}-${number}${suffix ? `-${suffix}` : ''}`
	}
	return `${baseId}-${suffix || uuidv4().slice(0, 8)}`
}

/**
 * Parse questions range string (e.g., "1-10", "21-24")
 */
export function parseQuestionsRange(range: string | number): QuestionRange {
	// Ensure range is always a string
	const rangeStr = typeof range === 'string' ? range : String(range)
	const cleanRange = rangeStr.trim()

	if (!cleanRange) {
		throw new Error('Range cannot be empty')
	}

	const match = cleanRange.match(/(\d+)(?:-(\d+))?/)

	if (!match) {
		throw new Error(`Invalid range format: ${range}`)
	}

	const start = parseInt(match[1])
	const end = match[2] ? parseInt(match[2]) : start

	if (start > end) {
		throw new Error(`Invalid range: start (${start}) cannot be greater than end (${end})`)
	}

	return {
		start,
		end,
		count: end - start + 1,
	}
}

/**
 * Generate question numbers array from range
 */
export function generateQuestionNumbers(range: string): number[] {
	const parsed = parseQuestionsRange(range)
	return Array.from({ length: parsed.count }, (_, i) => parsed.start + i)
}

/**
 * Ensure question has a valid questionId
 */
export function ensureQuestionId(
	question: any,
	test: string,
	section: string,
	part: number,
	fallbackNumber?: number
): any {
	// Add validation for undefined parameters
	const safeTest = test || '1'
	const safeSection = section || 'listening'
	const safePart = part || 1

	if (!question.questionId) {
		question.questionId = generateQuestionId(
			safeTest,
			safeSection,
			safePart,
			question.number || fallbackNumber,
			question.type
		)
	}
	return question
}

/**
 * Validate question structure and fix common issues
 */
export function validateAndFixQuestion(
	question: any,
	test: string,
	section: string,
	part: number,
	questionIndex: number
): any {
	// Add validation for undefined parameters
	const safeTest = test || '1'
	const safeSection = section || 'listening'
	const safePart = part || 1
	const safeQuestionIndex = questionIndex || 1

	// Ensure questionId exists
	question = ensureQuestionId(question, safeTest, safeSection, safePart, safeQuestionIndex)

	// Ensure text fields have default values (fix controlled/uncontrolled issue)
	if (question.text === undefined) question.text = ''
	if (question.questionText === undefined) question.questionText = ''
	if (question.headline === undefined) question.headline = ''
	if (question.instructions === undefined) question.instructions = ''
	if (question.answerConstraints === undefined) question.answerConstraints = ''
	if (question.url === undefined) question.url = ''

	// Ensure arrays exist
	if (question.textList && !Array.isArray(question.textList)) {
		question.textList = []
	}
	if (question.options && !Array.isArray(question.options)) {
		question.options = []
	}
	if (question.draggableVariants && !Array.isArray(question.draggableVariants)) {
		question.draggableVariants = []
	}

	// Ensure answer structure exists
	if (!question.answer) {
		question.answer = { correct: '', accepted: [] }
	}

	return question
}

/**
 * Get image file name pattern for consistent storage
 */
export function getImageFileName(
	questionId: string,
	test: string,
	section: string,
	part: number,
	extension: string = 'png'
): string {
	return `${section.toLowerCase()}-${test}-${section.toLowerCase()}-${part}-${questionId}.${extension}`
}

/**
 * Check if question type should have image upload
 */
export function shouldAllowImageUpload(questionType: string): boolean {
	return ['image', 'map-labelling'].includes(questionType)
}

/**
 * Get default question text based on type
 */
export function getDefaultQuestionText(type: string): string {
	switch (type) {
		case 'form-fill':
			return 'Complete the sentence: _____'
		case 'multiple-choice':
			return 'Choose the correct answer'
		case 'multi-select':
			return 'Choose TWO correct answers'
		case 'matching':
			return 'Match the item'
		case 'map-labelling':
			return 'Label the location: _____'
		case 'short-answer':
			return 'Write a short answer'
		case 'sentence-completion':
			return 'Complete the sentence: _____'
		case 'divider':
			return 'Instructions'
		case 'image':
			return 'Image'
		default:
			return 'Question text'
	}
}

/**
 * Create question template with proper defaults
 */
export function createQuestionTemplate(
	type: string,
	test: string,
	section: string,
	part: number,
	number?: number
): any {
	const questionId = generateQuestionId(test, section, part, number, type)

	const baseQuestion = {
		questionId,
		type,
		text: getDefaultQuestionText(type),
		questionText: getDefaultQuestionText(type),	
		isInteractive: !['divider', 'image'].includes(type),
		answer: { correct: '', accepted: [] },
		number: number || undefined,
	}

	// Add type-specific properties
	switch (type) {
		case 'multiple-choice':
			return {
				...baseQuestion,
				inputType: 'radio',
				textList: [
					{ variant: 'A', text: 'Option A', isInteractive: true },
					{ variant: 'B', text: 'Option B', isInteractive: true },
					{ variant: 'C', text: 'Option C', isInteractive: true },
				],
			}

		case 'multi-select':
			return {
				...baseQuestion,
				inputType: 'checkbox',
				options: [
					{ variant: 'A', text: 'Option A', isInteractive: true },
					{ variant: 'B', text: 'Option B', isInteractive: true },
					{ variant: 'C', text: 'Option C', isInteractive: true },
					{ variant: 'D', text: 'Option D', isInteractive: true },
					{ variant: 'E', text: 'Option E', isInteractive: true },
				],
			}

		case 'matching':
			return {
				...baseQuestion,
				inputType: 'drag',
				draggableVariants: [
					{ variant: 'A', text: 'Option A' },
					{ variant: 'B', text: 'Option B' },
					{ variant: 'C', text: 'Option C' },
					{ variant: 'D', text: 'Option D' },
					{ variant: 'E', text: 'Option E' },
					{ variant: 'F', text: 'Option F' },
				],
			}

		case 'map-labelling':
			return {
				...baseQuestion,
				answerConstraints: 'LABEL FROM MAP A-H',
			}

		case 'form-fill':
		case 'short-answer':
		case 'sentence-completion':
			return {
				...baseQuestion,
				answerConstraints: 'ONE WORD AND/OR A NUMBER',
			}

		case 'divider':
			return {
				...baseQuestion,
				isInteractive: false,
				topText: '',
				topInstructions: '',
				instructions: '',
				draggableVariants: [],
			}

		case 'image':
			return {
				...baseQuestion,
				isInteractive: false,
				url: '',
				headline: 'Image',
			}

		default:
			return baseQuestion
	}
}
