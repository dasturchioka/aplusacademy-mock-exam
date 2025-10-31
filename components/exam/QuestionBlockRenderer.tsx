'use client'
import { QuestionHandlers } from '@/lib/answerHandlers'
import { memo, useMemo } from 'react'

// Import all listening components
import ListeningDiagramLabelling from '@/components/exam/listening/DiagramLabelling'
import { FlowChartExam as ListeningFlowChart } from '@/components/exam/listening/FlowChart'
import ListeningFormCompletion from '@/components/exam/listening/FormCompletion'
import { MapLabellingExam as ListeningMapLabelling } from '@/components/exam/listening/MapLabelling'
import ListeningMatching from '@/components/exam/listening/Matching'
import ListeningMultipleChoice from '@/components/exam/listening/MultipleChoice'
import ListeningMultipleSelect from '@/components/exam/listening/MultipleSelect'
import ListeningTableCompletion from '@/components/exam/listening/TableCompletion'

// Import all reading components
import ReadingSummaryCompletion from '@/components/exam/reading/SummaryCompletion'
import ReadingSummarySelectCompletion from '@/components/exam/reading/SummarySelectCompletion'
import ReadingTrueFalseNotGiven from '@/components/exam/reading/TrueFalseNotGiven'
import ReadingYesNoNotGiven from '@/components/exam/reading/YesNoNotGiven'
import ReadingMatchingExam from './reading/Matching'

export interface QuestionBlock {
	id: string
	type: string
	questionStart: number | string
	questionEnd: number | string
	instructions: string[]
	answerConstraints?: string
	isInteractive: boolean
	inputType?: 'radio' | 'checkbox'
	questions?: any[]
	pairs?: any[]
	options?: any[]
	image?: { url: string; headline?: string }
	labels?: string[]
	choices?: any[]
	[key: string]: any
}

export interface AnswerData {
	value: string | string[]
	type: string
	questionNumber?: string
}

interface QuestionBlockRendererProps {
	questionBlock: QuestionBlock
	section: 'Listening' | 'Reading' | 'Writing'
	part: string
	className?: string
	disabled?: boolean
}

function QuestionBlockRenderer({
	questionBlock,
	section,
	part,
	className = '',
	disabled = false,
}: QuestionBlockRendererProps) {
	// Safety check for questionBlock properties
	if (!questionBlock || !questionBlock.questionStart) {
		return (
			<div className={`p-4 border border-red-200 rounded-lg bg-red-50 ${className}`}>
				<p className='text-red-600 font-medium'>
					Invalid question block - missing required properties
				</p>
				<p className='text-sm text-red-500 mt-1'>Block ID: {questionBlock?.id || 'unknown'}</p>
			</div>
		)
	}

	// Get question range
	const questionStart =
		typeof questionBlock.questionStart === 'string'
			? parseInt(questionBlock.questionStart)
			: questionBlock.questionStart
	const questionEnd =
		typeof questionBlock.questionEnd === 'string'
			? parseInt(questionBlock.questionEnd)
			: questionBlock.questionEnd

	// Create question-type specific handlers (memoized)
	const handlers = useMemo(() => {
		const createHandlers = () => {
			switch (questionBlock.type) {
				case 'form-completion':
				case 'note-completion':
				case 'sentence-completion':
					return {
						onAnswerChange: QuestionHandlers.createFormCompletionHandler(
							section as 'Listening' | 'Reading',
							questionStart,
							questionEnd
						),
						onAnswer: QuestionHandlers.createFormCompletionHandler(
							section as 'Listening' | 'Reading',
							questionStart,
							questionEnd
						),
					}

				case 'multiple-choice':
					return {
						onAnswerChange: QuestionHandlers.createMultipleChoiceHandler(
							section as 'Listening' | 'Reading',
							questionStart
						),
					}

				case 'multiple-select':
					return {
						onAnswerChange: QuestionHandlers.createMultipleSelectHandler(
							section as 'Listening' | 'Reading',
							questionStart,
							questionEnd
						),
					}

				case 'map-labelling':
				case 'diagram-labelling':
					return {
						onAnswerChange: QuestionHandlers.createLabellingHandler(
							section as 'Listening' | 'Reading',
							questionStart,
							questionEnd
						),
						onAnswer: QuestionHandlers.createLabellingHandler(
							section as 'Listening' | 'Reading',
							questionStart,
							questionEnd
						),
					}

				case 'matching':
				case 'matching-information':
				case 'matching-paragraphs':
				case 'matching-sentence-endings':
					return {
						onAnswerChange: QuestionHandlers.createMatchingHandler(
							section as 'Listening' | 'Reading',
							questionStart,
							questionEnd
						),
					}

				case 'true-false-not-given':
					return {
						onAnswerChange: QuestionHandlers.createTrueFalseHandler(
							'Reading',
							questionStart,
							questionEnd
						),
					}

				case 'yes-no-not-given':
					return {
						onAnswerChange: QuestionHandlers.createYesNoHandler(
							'Reading',
							questionStart,
							questionEnd
						),
					}

				case 'summary-completion':
					return {
						onAnswerChange: QuestionHandlers.createSummaryCompletionHandler(
							'Reading',
							questionStart,
							questionEnd
						),
					}

				case 'summary-select-completion':
					return {
						onAnswerChange: QuestionHandlers.createSummarySelectHandler(
							'Reading',
							questionStart,
							questionEnd
						),
					}

				case 'match-heading':
					return {
						onAnswerChange: QuestionHandlers.createMatchHeadingHandler(
							'Reading',
							questionStart,
							questionEnd
						),
						onChange: QuestionHandlers.createMatchHeadingHandler(
							'Reading',
							questionStart,
							questionEnd
						),
					}

				case 'table-completion':
					return {
						onAnswerChange: QuestionHandlers.createTableCompletionHandler(
							section as 'Listening' | 'Reading',
							questionStart,
							questionEnd
						),
						onAnswer: QuestionHandlers.createTableCompletionHandler(
							section as 'Listening' | 'Reading',
							questionStart,
							questionEnd
						),
					}

				case 'flow-chart':
					return {
						onAnswerChange: QuestionHandlers.createFlowChartHandler(
							section as 'Listening' | 'Reading',
							questionStart,
							questionEnd
						),
						onAnswer: QuestionHandlers.createFlowChartHandler(
							section as 'Listening' | 'Reading',
							questionStart,
							questionEnd
						),
					}

				default:
					console.warn(`No handler defined for question type: ${questionBlock.type}`)
					return {
						onAnswerChange: (value: any) =>
							console.log(`Unhandled answer for ${questionBlock.type}:`, value),
						onAnswer: (value: any) =>
							console.log(`Unhandled answer for ${questionBlock.type}:`, value),
					}
			}
		}
		return createHandlers()
	}, [questionBlock.type, section, questionStart, questionEnd])

	// Get current answers for this block from localStorage (memoized to prevent infinite loops)
	const currentAnswer = useMemo(() => {
		const allAnswers = QuestionHandlers.getAllStoredAnswers(section)

		// For components that handle multiple questions, return in new array format
		if (
			questionBlock.type === 'summary-select-completion' ||
			questionBlock.type === 'summary-completion' ||
			questionBlock.type === 'multiple-select' ||
			questionBlock.type === 'form-completion' ||
			questionBlock.type === 'note-completion' ||
			questionBlock.type === 'sentence-completion' ||
			questionBlock.type === 'matching' ||
			questionBlock.type === 'matching-sentence-endings' ||
			questionBlock.type === 'matching-information' ||
			questionBlock.type === 'matching-paragraphs' ||
			questionBlock.type === 'map-labelling' ||
			questionBlock.type === 'diagram-labelling' ||
			questionBlock.type === 'table-completion' ||
			questionBlock.type === 'flow-chart' ||
			questionBlock.type === 'true-false-not-given' ||
			questionBlock.type === 'yes-no-not-given' ||
			questionBlock.type === 'match-heading'
		) {
			// Return in new array format
			const answersArray: Array<{ number: number; answer: string }> = []

			for (let i = questionStart; i <= questionEnd; i++) {
				const answer = allAnswers[i.toString()]
				if (answer) {
					answersArray.push({ number: i, answer })
				}
			}


			// Only log in development and limit frequency
			//@ts-ignore
			if (process.env.NODE_ENV === 'development' && answersArray.length > 0) {
				console.log(
					`📖 Retrieved ${questionBlock.type} answers for Q${questionStart}-${questionEnd}:`,
					answersArray
				)
			}
			return answersArray
		}

		// For single question components (like multiple-choice), return the specific answer
		const singleAnswer = QuestionHandlers.getStoredAnswer(section, questionStart.toString())

		// Only log in development and when there's an answer
			//@ts-ignore
		if (process.env.NODE_ENV === 'development' && singleAnswer) {
			console.log(`📖 Retrieved ${questionBlock.type} answer for Q${questionStart}:`, singleAnswer)
		}
		return singleAnswer || ''
	}, [section, questionBlock.type, questionStart, questionEnd])

	// Convert question block data to component-specific formats
	const transformQuestionData = () => {
		// Start with spread, then override specific properties to avoid overwrites
		const baseQuestion = {
			...questionBlock,
			id: questionBlock.id,
			type: questionBlock.type,
			instructions: questionBlock.instructions || [],
			answerConstraints: questionBlock.answerConstraints || '',
		}

		// Transform based on question type
		switch (questionBlock.type) {
			case 'form-completion':
			case 'note-completion':
			case 'sentence-completion':
				return {
					...baseQuestion,
					questions: questionBlock.questions || [],
					numberRange: `${questionBlock.questionStart}-${questionBlock.questionEnd}`,
				}

			case 'multiple-choice':
				return {
					...baseQuestion,
					inputType: questionBlock.inputType || 'radio',
					questions: questionBlock.questions || [],
				}

			case 'multiple-select':
				return {
					...baseQuestion,
					choices: questionBlock.choices || questionBlock.questions?.[0]?.choices || [],
				}

			case 'true-false-not-given':
			case 'yes-no-not-given':
				return {
					...baseQuestion,
					inputType: 'radio' as const,
					questions: questionBlock.questions || [],
				}

			case 'map-labelling':
				return {
					...baseQuestion,
					image: questionBlock.image || { url: '', headline: 'Map' },
					labels: questionBlock.labels || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
					questions: questionBlock.questions || [],
				}

			case 'matching':
			case 'matching-information':
			case 'matching-paragraphs':
			case 'matching-sentence-endings':
				return {
					...baseQuestion,
					pairs: questionBlock.pairs || [],
					options: questionBlock.options || [],
				}

			case 'summary-completion':
				return {
					...baseQuestion,
					questions: questionBlock.questions || [],
				}

			case 'summary-select-completion':
				return {
					...baseQuestion,
					questions: questionBlock.questions || [],
					options: questionBlock.options || [],
				}

			default:
				return baseQuestion
		}
	}

	const transformedQuestion = transformQuestionData()

	// Render based on section and type
	const renderComponent = () => {
		// Use try-catch to handle any remaining type issues gracefully
		try {
			if (section === 'Listening') {
				switch (questionBlock.type) {
					case 'form-completion':
					case 'note-completion':
					case 'sentence-completion':
						return (
							<ListeningFormCompletion
								{...(transformedQuestion as any)}
								question={transformedQuestion}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'multiple-choice':
						return (
							<ListeningMultipleChoice
								{...(transformedQuestion as any)}
								question={transformedQuestion}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'multiple-select':
						return (
							<ListeningMultipleSelect
								{...({
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									questionText: (transformedQuestion as any).questionText || '',
									choices: (transformedQuestion as any).choices || [],
								} as any)}
								data={{
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									questionText: (transformedQuestion as any).questionText || '',
									choices: (transformedQuestion as any).choices || [],
								}}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'map-labelling':
						return (
							<ListeningMapLabelling
								{...({
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									image: transformedQuestion.image || { url: '', headline: 'Map' },
									labels: transformedQuestion.labels || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
								} as any)}
								questionBlock={{
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									image: transformedQuestion.image || { url: '', headline: 'Map' },
									labels: transformedQuestion.labels || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
								}}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'matching':
					case 'matching-information':
						return (
							<ListeningMatching
								{...({
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									pairs: transformedQuestion.pairs || [],
									options: transformedQuestion.options || [],
								} as any)}
								data={{
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									pairs: transformedQuestion.pairs || [],
									options: transformedQuestion.options || [],
								}}
								{...handlers}
								disabled={disabled}
							/>
						)

				case 'diagram-labelling':
					return (
						<ListeningDiagramLabelling
							question={{
								...transformedQuestion,
								questionStart: transformedQuestion.questionStart?.toString() || '1',
								questionEnd: transformedQuestion.questionEnd?.toString() || '1',
								image: transformedQuestion.image || { url: '', headline: 'Diagram' },
								questions: transformedQuestion.questions || [],
							}}
							{...handlers}
						/>
					)

				case 'table-completion':
						return (
							<ListeningTableCompletion
								{...({
									...transformedQuestion,
									headline: (transformedQuestion as any).headline || 'Table',
									cols: (transformedQuestion as any).cols || [],
									rows: (transformedQuestion as any).rows || [],
								} as any)}
								question={{
									...transformedQuestion,
									headline: (transformedQuestion as any).headline || 'Table',
									cols: (transformedQuestion as any).cols || [],
									rows: (transformedQuestion as any).rows || [],
								}}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'flow-chart':
						return (
							<ListeningFlowChart
								{...({
									...transformedQuestion,
									questionStart:
										typeof transformedQuestion.questionStart === 'number'
											? transformedQuestion.questionStart
											: parseInt(transformedQuestion.questionStart?.toString() || '1'),
									questionEnd:
										typeof transformedQuestion.questionEnd === 'number'
											? transformedQuestion.questionEnd
											: parseInt(transformedQuestion.questionEnd?.toString() || '1'),
									nodes: (transformedQuestion as any).nodes || [],
								} as any)}
								question={{
									...transformedQuestion,
									questionStart:
										typeof transformedQuestion.questionStart === 'number'
											? transformedQuestion.questionStart
											: parseInt(transformedQuestion.questionStart?.toString() || '1'),
									questionEnd:
										typeof transformedQuestion.questionEnd === 'number'
											? transformedQuestion.questionEnd
											: parseInt(transformedQuestion.questionEnd?.toString() || '1'),
									nodes: (transformedQuestion as any).nodes || [],
								}}
								{...handlers}
								disabled={disabled}
							/>
						)

					default:
						return null
				}
			}

			if (section === 'Reading') {
				switch (questionBlock.type) {
					case 'form-completion':
					case 'note-completion':
					case 'sentence-completion':
						return (
							<ListeningFormCompletion
								{...(transformedQuestion as any)}
								question={transformedQuestion}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'multiple-choice':
						return (
							<ListeningMultipleChoice
								{...(transformedQuestion as any)}
								question={transformedQuestion}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'multiple-select':
						return (
							<ListeningMultipleSelect
								{...({
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									questionText: (transformedQuestion as any).questionText || '',
									choices: (transformedQuestion as any).choices || [],
								} as any)}
								data={{
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									questionText: (transformedQuestion as any).questionText || '',
									choices: (transformedQuestion as any).choices || [],
								}}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'true-false-not-given':
						return (
							<ReadingTrueFalseNotGiven
								{...(transformedQuestion as any)}
								question={transformedQuestion}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'yes-no-not-given':
						return (
							<ReadingYesNoNotGiven
								{...(transformedQuestion as any)}
								question={transformedQuestion}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'matching':
					case 'matching-information':
					case 'matching-paragraphs':
						return (
							<ReadingMatchingExam
								{...({
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									pairs: transformedQuestion.pairs || [],
									options: transformedQuestion.options || [],
								} as any)}
								data={{
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									pairs: transformedQuestion.pairs || [],
									options: transformedQuestion.options || [],
								}}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'matching-sentence-endings':
						return (
							<ListeningMatching
								{...({
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									pairs: transformedQuestion.pairs || [],
									options: transformedQuestion.options || [],
								} as any)}
								data={{
									...transformedQuestion,
									questionStart: transformedQuestion.questionStart?.toString() || '1',
									questionEnd: transformedQuestion.questionEnd?.toString() || '1',
									pairs: transformedQuestion.pairs || [],
									options: transformedQuestion.options || [],
								}}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'match-heading':
						// Skip rendering if this is handled inline in the passage
						// The inline version is handled in ReadingSection.tsx with ParagraphDropZone
						return null

					case 'summary-completion':
						return (
							<ReadingSummaryCompletion
								{...(transformedQuestion as any)}
								questionBlock={transformedQuestion}
								answer={currentAnswer}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'summary-select-completion':
						return (
							<ReadingSummarySelectCompletion
								{...(transformedQuestion as any)}
								questionBlock={transformedQuestion}
								answer={currentAnswer}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'table-completion':
						return (
							<ListeningTableCompletion
								{...({
									...transformedQuestion,
									headline: (transformedQuestion as any).headline || 'Table',
									cols: (transformedQuestion as any).cols || [],
									rows: (transformedQuestion as any).rows || [],
								} as any)}
								question={{
									...transformedQuestion,
									headline: (transformedQuestion as any).headline || 'Table',
									cols: (transformedQuestion as any).cols || [],
									rows: (transformedQuestion as any).rows || [],
								}}
								{...handlers}
								disabled={disabled}
							/>
						)

					case 'flow-chart':
						return (
							<ListeningFlowChart
								{...({
									...transformedQuestion,
									questionStart:
										typeof transformedQuestion.questionStart === 'number'
											? transformedQuestion.questionStart
											: parseInt(transformedQuestion.questionStart?.toString() || '1'),
									questionEnd:
										typeof transformedQuestion.questionEnd === 'number'
											? transformedQuestion.questionEnd
											: parseInt(transformedQuestion.questionEnd?.toString() || '1'),
									nodes: (transformedQuestion as any).nodes || [],
								} as any)}
								question={{
									...transformedQuestion,
									questionStart:
										typeof transformedQuestion.questionStart === 'number'
											? transformedQuestion.questionStart
											: parseInt(transformedQuestion.questionStart?.toString() || '1'),
									questionEnd:
										typeof transformedQuestion.questionEnd === 'number'
											? transformedQuestion.questionEnd
											: parseInt(transformedQuestion.questionEnd?.toString() || '1'),
									nodes: (transformedQuestion as any).nodes || [],
								}}
								{...handlers}
								disabled={disabled}
							/>
						)

				case 'diagram-labelling':
					return (
						<ListeningDiagramLabelling
							question={{
								...transformedQuestion,
								questionStart: transformedQuestion.questionStart?.toString() || '1',
								questionEnd: transformedQuestion.questionEnd?.toString() || '1',
								image: transformedQuestion.image || { url: '', headline: 'Diagram' },
								questions: transformedQuestion.questions || [],
							}}
							{...handlers}
						/>
					)

				default:
						return null
				}
			}

			return null
		} catch (error) {
			console.error('Error rendering question component:', error)
			return (
				<div className='p-4 border border-red-200 rounded-lg bg-red-50'>
					<p className='text-red-600 font-medium'>
						Error rendering question type "{questionBlock.type}"
					</p>
					<p className='text-sm text-red-500 mt-1'>
						Block ID: {questionBlock.id} | Error:{' '}
						{error instanceof Error ? error.message : 'Unknown error'}
					</p>
				</div>
			)
		}
	}

	const component = renderComponent()

	if (!component) {
		return (
			<div className={`p-4 border border-orange-200 rounded-lg bg-orange-50 ${className}`}>
				<p className='text-orange-600 font-medium'>
					Question type "{questionBlock.type}" not yet implemented for {section} section
				</p>
				<p className='text-sm text-orange-500 mt-1'>
					Block ID: {questionBlock.id} | Questions: {questionBlock.questionStart}-
					{questionBlock.questionEnd}
				</p>
				<div className='mt-2 text-xs text-orange-700'>
					<details>
						<summary>Debug Info</summary>
						<pre className='mt-1 text-xs overflow-auto max-h-32'>
							{JSON.stringify(questionBlock, null, 2)}
						</pre>
					</details>
				</div>
			</div>
		)
	}

	return <div className={`question-block ${className}`}>{component}</div>
}

// Helper function to get question count for a block
export function getQuestionCount(block: QuestionBlock): number {
	if (block.questionStart && block.questionEnd) {
		const start =
			typeof block.questionStart === 'string' ? parseInt(block.questionStart) : block.questionStart
		const end =
			typeof block.questionEnd === 'string' ? parseInt(block.questionEnd) : block.questionEnd
		return end - start + 1
	}

	// Fallback: count questions in the questions array
	if (block.questions && Array.isArray(block.questions)) {
		return block.questions.filter(q => q.isInteractive !== false).length
	}

	return 1 // Default to 1 question
}

// Helper function to get question numbers for a block
export function getQuestionNumbers(block: QuestionBlock): string[] {
	if (block.questionStart && block.questionEnd) {
		const start =
			typeof block.questionStart === 'string' ? parseInt(block.questionStart) : block.questionStart
		const end =
			typeof block.questionEnd === 'string' ? parseInt(block.questionEnd) : block.questionEnd

		const numbers: string[] = []
		for (let i = start; i <= end; i++) {
			numbers.push(i.toString())
		}
		return numbers
	}

	// Fallback: extract from questions array
	if (block.questions && Array.isArray(block.questions)) {
		return block.questions.filter(q => q.questionNumber).map(q => q.questionNumber.toString())
	}

	return ['1'] // Defaul
}

export default memo(QuestionBlockRenderer)
