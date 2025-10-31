import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { QuestionNumber } from './QuestionNumber'

interface Question {
	questionId?: string
	number?: number
	numberRange?: string
	type: string
	text?: string
	answerConstraints?: string
	isInteractive?: boolean
	options?: Array<{
		variant: string
		text: string
		isInteractive?: boolean
	}>
}

interface MultiSelectQuestionProps {
	question: Question
	answer: string[]
	onAnswer: (value: string[]) => void
	disabled: boolean
	partNumber?: number
}

export function MultiSelectQuestion({
	question,
	answer,
	onAnswer,
	disabled,
	partNumber,
}: MultiSelectQuestionProps) {
	const handleCheckboxChange = (variant: string, checked: boolean) => {
		if (checked) {
			onAnswer([...answer, variant])
		} else {
			onAnswer(answer.filter(item => item !== variant))
		}
	}

	return (
		<div className='space-y-3'>
			{/* Question text */}
			<div className='flex items-start space-x-3'>
				<QuestionNumber question={question} partNumber={partNumber} />
				<div className='flex-1'>
					<p className='text-base text-gray-700 leading-relaxed'>{question.text}</p>
				</div>
			</div>

			{/* Answer choices */}
			<div className='ml-8'>
				<div className='space-y-2'>
					{question.options?.map(option => (
						<div key={option.variant} className='flex items-center space-x-3'>
							<Checkbox
								id={`${question.questionId}-${option.variant}`}
								checked={answer.includes(option.variant)}
								onCheckedChange={checked =>
									handleCheckboxChange(option.variant, checked as boolean)
								}
								disabled={disabled}
								className={`
                  w-4 h-4 border-2
                  ${
										disabled
											? 'border-gray-300 text-gray-400'
											: 'border-gray-400 data-[state=checked]:bg-[#D32F2F] data-[state=checked]:border-[#D32F2F]'
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
				</div>
			</div>

			{/* Answer constraints */}
			{question.answerConstraints && (
				<p className='text-xs text-gray-500 ml-8 italic'>{question.answerConstraints}</p>
			)}
		</div>
	)
}
