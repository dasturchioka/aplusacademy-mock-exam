/**
 * Utility functions to fix common issues in Listening test JSON data
 */

interface Question {
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

interface Part {
	part: number
	instructions: string
	questionsRange: string
	questions: Question[]
}

interface ListeningData {
	test: string
	section: string
	parts: Part[]
}

/**
 * Fix question numbering to follow IELTS pattern (1-10, 11-20, 21-30, 31-40)
 */
export function fixQuestionNumbering(data: ListeningData): ListeningData {
	const fixedData = { ...data }

	fixedData.parts = data.parts.map(part => {
		const partStartNumber = (part.part - 1) * 10 + 1
		const partEndNumber = part.part * 10

		let questionCounter = 0

		const fixedQuestions = part.questions.map(question => {
			// Only number interactive questions
			if (question.isInteractive !== false &&
				question.type !== 'static' &&
				question.type !== 'divider' &&
				question.type !== 'image') {

				const correctNumber = partStartNumber + questionCounter
				questionCounter++

				return {
					...question,
					number: correctNumber,
					isInteractive: true
				}
			}

			// Non-interactive elements
			return {
				...question,
				isInteractive: false
			}
		})

		// Update part range
		const interactiveCount = fixedQuestions.filter(q => q.isInteractive).length
		const endNumber = partStartNumber + interactiveCount - 1

		return {
			...part,
			questionsRange: `${partStartNumber}-${Math.min(endNumber, partEndNumber)}`,
			questions: fixedQuestions
		}
	})

	return fixedData
}

/**
 * Ensure all questions have correct isInteractive flag
 */
export function fixInteractiveFlags(data: ListeningData): ListeningData {
	const fixedData = { ...data }

	fixedData.parts = data.parts.map(part => ({
		...part,
		questions: part.questions.map(question => ({
			...question,
			isInteractive: question.isInteractive ?? (
				question.type !== 'static' &&
				question.type !== 'divider' &&
				question.type !== 'image'
			)
		}))
	}))

	return fixedData
}

/**
 * Validate question types and provide fallbacks
 */
export function validateQuestionTypes(data: ListeningData): ListeningData {
	const validTypes = [
		'form-fill',
		'multiple-choice',
		'multi-select',
		'matching',
		'map-labelling',
		'short-answer',
		'sentence-completion',
		'static',
		'divider',
		'image'
	]

	const fixedData = { ...data }

	fixedData.parts = data.parts.map(part => ({
		...part,
		questions: part.questions.map(question => {
			if (!validTypes.includes(question.type)) {
				console.warn(`Unknown question type: ${question.type}, treating as form-fill`)
				return {
					...question,
					type: 'form-fill',
					isInteractive: true
				}
			}
			return question
		})
	}))

	return fixedData
}

/**
 * Comprehensive fix for all common issues
 */
export function fixListeningData(data: ListeningData): ListeningData {
	let fixedData = data

	// Apply all fixes in sequence
	fixedData = fixInteractiveFlags(fixedData)
	fixedData = validateQuestionTypes(fixedData)
	fixedData = fixQuestionNumbering(fixedData)

	return fixedData
}

/**
 * Generate debugging report for question numbering
 */
export function generateQuestionReport(data: ListeningData): string {
	let report = '📊 Listening Test Question Report\n\n'

	data.parts.forEach(part => {
		const interactive = part.questions.filter(q => q.isInteractive)
		const nonInteractive = part.questions.filter(q => !q.isInteractive)

		report += `Part ${part.part} (${part.questionsRange}):\n`
		report += `  Interactive questions: ${interactive.length}\n`
		report += `  Non-interactive elements: ${nonInteractive.length}\n`

		interactive.forEach(q => {
			report += `    Q${q.number}: ${q.type} - "${q.text || q.questionText || 'No text'}"\n`
		})

		nonInteractive.forEach(q => {
			report += `    ${q.type}: "${q.text || q.topText || q.headline || 'No text'}"\n`
		})

		report += '\n'
	})

	const totalInteractive = data.parts.reduce((sum, part) =>
		sum + part.questions.filter(q => q.isInteractive).length, 0
	)

	report += `Total interactive questions: ${totalInteractive}/40\n`

	if (totalInteractive !== 40) {
		report += '⚠️  Warning: IELTS Listening should have exactly 40 questions!\n'
	}

	return report
}
