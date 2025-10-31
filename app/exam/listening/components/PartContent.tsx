import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DividerContent } from './questions/DividerContent'
import { FormFillQuestion } from './questions/FormFillQuestion'
import { ImageContent } from './questions/ImageContent'
import { MapLabellingQuestion } from './questions/MapLabellingQuestion'
import { MatchingQuestion } from './questions/MatchingQuestion'
import { MultipleChoiceQuestion } from './questions/MultipleChoiceQuestion'
import { MultiSelectQuestion } from './questions/MultiSelectQuestion'
import { StaticContent } from './questions/StaticContent'

interface Answer {
	questionId: string
	value: string | string[]
	type: string
}

interface Question {
	questionId?: string
	number?: number
	type: string
	text?: string
	questionText?: string
	headline?: string
	subHeadline?: string
	instructions?: string
	inputType?: string
	answerConstraints?: string
	isInteractive?: boolean
	answer?: any
	textList?: Array<{
		variant: string
		text: string
		isInteractive: boolean
	}>
	options?: Array<{
		variant: string
		text: string
		isInteractive: boolean
	}>
	draggableVariants?: Array<{
		variant: string
		text: string
	}>
	url?: string
	topText?: string
	topInstructions?: string
	numberRange?: string
}

interface Part {
	part: number
	instructions: string
	questionsRange: string
	questions: Question[]
	headline?: string
}

interface PartContentProps {
	part: Part | undefined
	answers: Record<string, Answer>
	onAnswerUpdate: (questionId: string, value: string | string[], type: string) => void
	disabled: boolean
}

export function PartContent({ part, answers, onAnswerUpdate, disabled }: PartContentProps) {
	if (!part) {
		return (
			<Card className='h-96 flex items-center justify-center'>
				<p className='text-gray-500'>Loading part content...</p>
			</Card>
		)
	}

	const renderQuestion = (question: Question, index: number) => {
		const key = `${part.part}-${index}`

		// Ensure non-interactive elements are marked properly
		const processedQuestion = {
			...question,
			isInteractive:
				question.isInteractive ??
				(question.type !== 'static' && question.type !== 'divider' && question.type !== 'image'),
		}

		switch (processedQuestion.type) {
			case 'form-fill':
			case 'sentence-completion':
				return (
					<FormFillQuestion
						key={key}
						question={processedQuestion}
						answer={(answers[processedQuestion.questionId!]?.value as string) || ''}
						onAnswer={value =>
							onAnswerUpdate(processedQuestion.questionId!, value, processedQuestion.type)
						}
						disabled={disabled}
						partNumber={part.part}
					/>
				)

			case 'multiple-choice':
				return (
					<MultipleChoiceQuestion
						key={key}
						question={processedQuestion}
						answer={(answers[processedQuestion.questionId!]?.value as string) || ''}
						onAnswer={value =>
							onAnswerUpdate(processedQuestion.questionId!, value, 'multiple-choice')
						}
						disabled={disabled}
						partNumber={part.part}
					/>
				)

			case 'multi-select':
				return (
					<MultiSelectQuestion
						key={key}
						question={processedQuestion}
						answer={(answers[processedQuestion.questionId!]?.value as string[]) || []}
						onAnswer={value => onAnswerUpdate(processedQuestion.questionId!, value, 'multi-select')}
						disabled={disabled}
						partNumber={part.part}
					/>
				)

			case 'map-labelling':
				return (
					<MapLabellingQuestion
						key={key}
						question={processedQuestion}
						answer={(answers[processedQuestion.questionId!]?.value as string) || ''}
						onAnswer={value =>
							onAnswerUpdate(processedQuestion.questionId!, value, 'map-labelling')
						}
						disabled={disabled}
						partNumber={part.part}
					/>
				)

			case 'matching':
				return (
					<MatchingQuestion
						key={key}
						question={processedQuestion}
						answer={(answers[processedQuestion.questionId!]?.value as string) || ''}
						onAnswer={value => onAnswerUpdate(processedQuestion.questionId!, value, 'matching')}
						disabled={disabled}
						partNumber={part.part}
					/>
				)

			case 'short-answer':
				return (
					<FormFillQuestion
						key={key}
						question={{ ...processedQuestion, type: 'short-answer' }}
						answer={(answers[processedQuestion.questionId!]?.value as string) || ''}
						onAnswer={value => onAnswerUpdate(processedQuestion.questionId!, value, 'short-answer')}
						disabled={disabled}
						partNumber={part.part}
					/>
				)

			case 'static':
				return <StaticContent key={key} question={processedQuestion} />

			case 'divider':
				return <DividerContent key={key} question={processedQuestion} />

			case 'image':
				return <ImageContent key={key} question={processedQuestion} />

			default:
				// Handle unknown question types gracefully
				if (processedQuestion.isInteractive) {
					console.warn(`Unknown interactive question type: ${processedQuestion.type}`)
					return (
						<div key={key} className='p-4 bg-yellow-50 border border-yellow-200 rounded'>
							<p className='text-sm text-yellow-800'>
								Unknown question type: {processedQuestion.type} (treating as form-fill)
							</p>
							<FormFillQuestion
								question={{ ...processedQuestion, type: 'form-fill' }}
								answer={(answers[processedQuestion.questionId!]?.value as string) || ''}
								onAnswer={value =>
									onAnswerUpdate(processedQuestion.questionId!, value, processedQuestion.type)
								}
								disabled={disabled}
								partNumber={part.part}
							/>
						</div>
					)
				} else {
					return <StaticContent key={key} question={processedQuestion} />
				}
		}
	}

	return (
		<Card className='min-h-96'>
			<CardHeader>
				<CardTitle className='text-2xl font-bold text-[#D32F2F]'>Part {part.part}</CardTitle>
				{part.headline && (
					<h3 className='text-lg font-semibold text-gray-800 mt-2'>{part.headline}</h3>
				)}
				<div className='space-y-2'>
					<p className='text-sm text-gray-600'>
						<span className='font-medium'>Questions {part.questionsRange}</span>
					</p>
					<p className='text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-[#D32F2F]'>
						{part.instructions}
					</p>
				</div>
			</CardHeader>

			<CardContent>
				<div className='space-y-4'>
					{part.questions.map((question, index) => renderQuestion(question, index))}
				</div>
			</CardContent>
		</Card>
	)
}
