import { Input } from '@/components/ui/input'
import { QuestionNumber } from './QuestionNumber'

interface Question {
	questionId?: string
	number?: number
	numberRange?: string
	type: string
	text?: string
	headline?: string
	subHeadline?: string
	inputType?: string
	answerConstraints?: string
	isInteractive?: boolean
}

interface FormFillQuestionProps {
	question: Question
	answer: string
	onAnswer: (value: string) => void
	disabled: boolean
	partNumber?: number
}

export function FormFillQuestion({
	question,
	answer,
	onAnswer,
	disabled,
	partNumber,
}: FormFillQuestionProps) {
	const handleInputChange = (value: string) => {
		// Apply character limit based on constraints
		if (question.answerConstraints?.includes('ONE WORD')) {
			// Allow single word or word with number
			const cleanValue = value.trim()
			if (cleanValue.split(/\s+/).length <= 1) {
				onAnswer(cleanValue)
			}
		} else {
			onAnswer(value)
		}
	}

	return (
		<div className='space-y-2'>
			{/* Question headline */}
			{question.headline && (
				<h4 className='text-lg font-semibold text-gray-800 mt-4'>{question.headline}</h4>
			)}

			{/* Sub-headline */}
			{question.subHeadline && (
				<h5 className='text-base font-medium text-gray-700 mt-2'>{question.subHeadline}</h5>
			)}

			{/* Question with inline input */}
			<div className='flex items-center space-x-2 text-base'>
				<QuestionNumber question={question} partNumber={partNumber} />

				{/* Question text with inline input */}
				<div className='flex-1 flex items-center space-x-2'>
					{question.text?.split('____').map((part, index) => (
						<span key={index} className='text-gray-700'>
							{part}
							{index < question.text!.split('____').length - 1 && (
								<Input
									type='text'
									value={answer}
									onChange={e => handleInputChange(e.target.value)}
									disabled={disabled}
									className={`
                    inline-block w-24 h-8 mx-2 px-2 text-sm border-2 border-b-4 border-gray-300
                    rounded-none border-l-0 border-r-0 border-t-0 focus:border-[#D32F2F] focus:ring-0
                    ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}
                  `}
									placeholder='?'
								/>
							)}
						</span>
					))}
				</div>
			</div>

			{/* Answer constraints */}
			{question.answerConstraints && (
				<p className='text-xs text-gray-500 italic ml-8'>{question.answerConstraints}</p>
			)}
		</div>
	)
}
