import { Input } from '@/components/ui/input'
import { QuestionNumber } from './QuestionNumber'

interface Question {
	questionId?: string
	number?: number
	numberRange?: string
	type: string
	text?: string
	answerConstraints?: string
	isInteractive?: boolean
}

interface MapLabellingQuestionProps {
	question: Question
	answer: string
	onAnswer: (value: string) => void
	disabled: boolean
	partNumber?: number
}

export function MapLabellingQuestion({
	question,
	answer,
	onAnswer,
	disabled,
	partNumber,
}: MapLabellingQuestionProps) {
	const handleInputChange = (value: string) => {
		// For map labelling, typically single letters A-H
		const cleanValue = value.toUpperCase().trim()
		if (cleanValue.length <= 1 && /^[A-H]?$/.test(cleanValue)) {
			onAnswer(cleanValue)
		}
	}

	return (
		<div className='space-y-2'>
			{/* Question with inline input */}
			<div className='flex items-center space-x-3'>
				<QuestionNumber question={question} partNumber={partNumber} />

				<div className='flex-1 flex items-center space-x-3'>
					<span className='text-gray-700 text-base'>{question.text?.replace('____', '')}</span>

					<Input
						type='text'
						value={answer}
						onChange={e => handleInputChange(e.target.value)}
						disabled={disabled}
						className={`
              w-12 h-8 px-2 text-sm text-center border-2 rounded font-medium
              ${
								disabled
									? 'bg-gray-100 border-gray-300 text-gray-400'
									: 'bg-white border-gray-300 focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]'
							}
            `}
						placeholder='?'
						maxLength={1}
					/>
				</div>
			</div>

			{/* Answer constraints */}
			{question.answerConstraints && (
				<p className='text-xs text-gray-500 ml-6 italic'>{question.answerConstraints}</p>
			)}
		</div>
	)
}
