'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	calculateSectionScore,
	CorrectAnswersStructure,
	evaluateUserAnswers,
	getQuestionType,
} from '@/lib/answerEvaluation'
import { AlertTriangle, CheckCircle, Loader2, Play, XCircle } from 'lucide-react'
import { useState } from 'react'

interface AutoEvaluateAnswersProps {
	testId: string
	sectionName: string
	userAnswers: Array<{ [key: string]: any; isCorrect?: boolean | null }>
	correctAnswers: CorrectAnswersStructure | null
	onEvaluationComplete: (updatedAnswers: Array<{ [key: string]: any; isCorrect: boolean }>) => void
}

export default function AutoEvaluateAnswers({
	testId,
	sectionName,
	userAnswers,
	correctAnswers,
	onEvaluationComplete,
}: AutoEvaluateAnswersProps) {
	const [isEvaluating, setIsEvaluating] = useState(false)
	const [evaluationResults, setEvaluationResults] = useState<{
		correct: number
		total: number
		percentage: number
		details: Record<number, boolean>
	} | null>(null)
	const [error, setError] = useState<string | null>(null)

	// Check if correct answers are available for this section
	const hasCorrectAnswers =
		correctAnswers &&
		correctAnswers.some(
			section => section.section === sectionName && section.answers && section.answers.length > 0
		)

	const handleAutoEvaluate = async () => {
		if (!correctAnswers || !hasCorrectAnswers) {
			setError(`No correct answers available for ${sectionName} section`)
			return
		}

		setIsEvaluating(true)
		setError(null)

		try {
			// Convert user answers to the format expected by evaluation function
			const userAnswersMap: Record<number, string> = {}

			console.log(userAnswers)

			userAnswers.forEach(answer => {
				Object.keys(answer).forEach(key => {
					if (key !== 'isCorrect') {
						const questionNumber = parseInt(key)
						if (!isNaN(questionNumber)) {
							userAnswersMap[questionNumber] = answer[key] || ''
						}
					}
				})
			})

			console.log(userAnswersMap)


			// Evaluate answers using the evaluation utility
			const evaluationDetails = evaluateUserAnswers(correctAnswers, userAnswersMap, sectionName)

			// Calculate section score
			const sectionScore = calculateSectionScore(correctAnswers, userAnswersMap, sectionName)

			// Update the user answers with evaluation results
			const updatedAnswers = userAnswers.map(answer => {
				const updatedAnswer = { ...answer }

				Object.keys(answer).forEach(key => {
					if (key !== 'isCorrect') {
						const questionNumber = parseInt(key)
						if (!isNaN(questionNumber) && evaluationDetails[questionNumber] !== undefined) {
							updatedAnswer.isCorrect = evaluationDetails[questionNumber]
						}
					}
				})

				return updatedAnswer
			})

			// Set evaluation results for display
			setEvaluationResults({
				correct: sectionScore.correct,
				total: sectionScore.total,
				percentage: sectionScore.percentage,
				details: evaluationDetails,
			})

			// Call the callback to update the parent component
			onEvaluationComplete(updatedAnswers)
		} catch (err: any) {
			console.error('Auto-evaluation failed:', err)
			setError(`Failed to evaluate answers: ${err.message}`)
		} finally {
			setIsEvaluating(false)
		}
	}

	if (!hasCorrectAnswers) {
		return (
			<Alert>
				<AlertTriangle className='h-4 w-4' />
				<AlertDescription>
					No correct answers available for {sectionName} section. Auto-evaluation is not possible.
				</AlertDescription>
			</Alert>
		)
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center gap-4'>
				<Button
					onClick={handleAutoEvaluate}
					disabled={isEvaluating}
					className='flex items-center gap-2'
				>
					{isEvaluating ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : (
						<Play className='h-4 w-4' />
					)}
					{isEvaluating ? 'Evaluating...' : `Auto-Evaluate ${sectionName}`}
				</Button>
				<Badge>Beta</Badge>

				{evaluationResults && (
					<div className='flex items-center gap-2'>
						<Badge variant='outline' className='flex items-center gap-1'>
							<CheckCircle className='h-3 w-3 text-green-600' />
							{evaluationResults.correct} Correct
						</Badge>
						<Badge variant='outline' className='flex items-center gap-1'>
							<XCircle className='h-3 w-3 text-red-600' />
							{evaluationResults.total - evaluationResults.correct} Incorrect
						</Badge>
						<Badge variant='secondary'>{evaluationResults.percentage}% Score</Badge>
					</div>
				)}
			</div>

			{error && (
				<Alert variant='destructive'>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{evaluationResults && (
				<Alert>
					<CheckCircle className='h-4 w-4' />
					<AlertDescription>
						Auto-evaluation completed! {evaluationResults.correct} out of {evaluationResults.total}{' '}
						answers are correct ({evaluationResults.percentage}% score). The question correctness
						has been updated below.
					</AlertDescription>
				</Alert>
			)}

			{evaluationResults && (
				<div className='text-sm text-gray-600'>
					<details>
						<summary className='cursor-pointer hover:text-gray-800'>
							View evaluation details
						</summary>
						<div className='mt-2 space-y-1 max-h-40 overflow-y-auto'>
							{Object.entries(evaluationResults.details).map(([qNum, isCorrect]) => {
								const questionType = getQuestionType(parseInt(qNum), correctAnswers!, sectionName)
								return (
									<div key={qNum} className='flex items-center gap-2 text-xs'>
										<span className='w-8'>Q{qNum}:</span>
										{isCorrect ? (
											<CheckCircle className='h-3 w-3 text-green-600' />
										) : (
											<XCircle className='h-3 w-3 text-red-600' />
										)}
										<span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
											{isCorrect ? 'Correct' : 'Incorrect'}
										</span>
										{questionType !== 'standard' && (
											<Badge variant='outline' className='text-xs'>
												{questionType}
											</Badge>
										)}
									</div>
								)
							})}
						</div>
					</details>
				</div>
			)}
		</div>
	)
}
