import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { QuestionNumber } from './QuestionNumber'

interface Question {
	questionId?: string
	number?: number
	numberRange?: string
	type: string
	questionText?: string
	answerConstraints?: string
	isInteractive?: boolean
	textList?: Array<{
		variant: string
		text: string
		isInteractive?: boolean
	}>
}

interface MultipleChoiceQuestionProps {
	question: Question
	answer: string
	onAnswer: (value: string) => void
	disabled: boolean
	partNumber?: number
}

export function MultipleChoiceQuestion({
	question,
	answer,
	onAnswer,
	disabled,
	partNumber,
}: MultipleChoiceQuestionProps) {
	return (
		<div className='space-y-3'>
			{/* Question text */}
			<div className='flex items-start space-x-3'>
				<QuestionNumber question={question} partNumber={partNumber} />
				<div className='flex-1'>
					<p className='text-base text-gray-700 leading-relaxed'>{question.questionText}</p>
				</div>
			</div>

			{/* Answer choices */}
			<div className='ml-6'>
				<RadioGroup
					value={answer}
					onValueChange={onAnswer}
					disabled={disabled}
					className='space-y-2'
				>
					{question.textList?.map(option => (
						<div key={option.variant} className='flex items-center space-x-3'>
							<RadioGroupItem
								value={option.variant}
								id={`${question.questionId}-${option.variant}`}
								disabled={disabled}
								className={`
                  w-4 h-4 border-2
                  ${
										disabled
											? 'border-gray-300 text-gray-400'
											: 'border-gray-400 text-[#D32F2F] focus:ring-[#D32F2F]'
									}
                `}
							/>
							<Label
								htmlFor={`${question.questionId}-${option.variant}`}
								className={`
                  text-sm cursor-pointer flex-1 leading-relaxed
                  ${disabled ? 'text-gray-400' : 'text-gray-700'}
                `}
							>
								<span className='font-medium mr-2'>{option.variant}</span>
								{option.text}
							</Label>
						</div>
					))}
				</RadioGroup>
			</div>

			{/* Answer constraints */}
			{question.answerConstraints && (
				<p className='text-xs text-gray-500 ml-6 italic'>{question.answerConstraints}</p>
			)}
		</div>
	)
}
