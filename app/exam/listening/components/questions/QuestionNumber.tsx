import { Badge } from '@/components/ui/badge'

interface Question {
	number?: number
	numberRange?: string
	isInteractive?: boolean
	type: string
}

interface QuestionNumberProps {
	question: Question
	partNumber?: number
	className?: string
}

export function QuestionNumber({ question, partNumber, className = '' }: QuestionNumberProps) {
	// Don't render numbers for non-interactive questions
	if (!question.isInteractive || question.type === 'static' || question.type === 'divider' || question.type === 'image') {
		return null
	}

	// Calculate correct question number based on part
	const getCorrectQuestionNumber = (questionNumber: number | undefined, partNum: number | undefined) => {
		if (!questionNumber || !partNum) return questionNumber

		// Ensure question numbering follows IELTS pattern: Part 1 (1-10), Part 2 (11-20), etc.
		const partStartNumber = (partNum - 1) * 10 + 1
		const partEndNumber = partNum * 10

		// If question number is already in correct range, return it
		if (questionNumber >= partStartNumber && questionNumber <= partEndNumber) {
			return questionNumber
		}

		// Otherwise, adjust it to the correct range
		// Assume questions are sequential within the part
		const adjustedNumber = partStartNumber + ((questionNumber - 1) % 10)
		return Math.min(adjustedNumber, partEndNumber)
	}

	const displayNumber = getCorrectQuestionNumber(question.number, partNumber)

	if (question.numberRange) {
		return (
			<Badge variant='outline' className={`font-medium text-[#D32F2F] border-[#D32F2F] min-w-[4rem] justify-center ${className}`}>
				{question.numberRange}
			</Badge>
		)
	}

	if (displayNumber) {
		return (
			<Badge variant='outline' className={`font-medium text-[#D32F2F] border-[#D32F2F] min-w-[2.5rem] justify-center ${className}`}>
				{displayNumber}
			</Badge>
		)
	}

	return null
}