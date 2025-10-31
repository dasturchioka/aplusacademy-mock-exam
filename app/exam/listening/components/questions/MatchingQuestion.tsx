import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

interface MatchingQuestionProps {
	question: Question
	answer: string
	onAnswer: (value: string) => void
	disabled: boolean
	partNumber?: number
}

export function MatchingQuestion({
	question,
	answer,
	onAnswer,
	disabled,
	partNumber,
}: MatchingQuestionProps) {
	// For now, we'll implement a simplified version with buttons
	// In a full implementation, this would have drag-and-drop functionality
	const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

	return (
		<div className='space-y-3'>
			{/* Question text */}
			<div className='flex items-start space-x-3'>
				<QuestionNumber question={question} partNumber={partNumber} />
				<div className='flex-1'>
					<p className='text-base text-gray-700 leading-relaxed'>{question.text}</p>
				</div>
			</div>

			{/* Answer selection */}
			<div className='ml-6'>
				<div className='flex items-center space-x-2 mb-2'>
					<span className='text-sm text-gray-600'>Select answer:</span>
					{answer && (
						<Badge variant='outline' className='bg-[#D32F2F] text-white border-[#D32F2F]'>
							{answer}
						</Badge>
					)}
				</div>

				<div className='flex flex-wrap gap-2'>
					{options.map(option => (
						<Button
							key={option}
							variant={answer === option ? 'default' : 'outline'}
							size='sm'
							onClick={() => onAnswer(option)}
							disabled={disabled}
							className={`
                w-10 h-10 rounded-md
                ${
									answer === option
										? 'bg-[#D32F2F] text-white border-[#D32F2F]'
										: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
								}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
						>
							{option}
						</Button>
					))}
				</div>
			</div>

			{/* Answer constraints */}
			{question.answerConstraints && (
				<p className='text-xs text-gray-500 ml-6 italic'>{question.answerConstraints}</p>
			)}
		</div>
	)
}
