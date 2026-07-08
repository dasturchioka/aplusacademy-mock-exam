'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CheckCircle, X } from 'lucide-react'
import { getCorrectAnswerForDisplay, type CorrectAnswersStructure } from '@/lib/answerEvaluation'
import { buildQuestionRows, countCorrectRows, type ResultAnswer } from '@/lib/resultAnalysis'

type Props = {
	mode: 'admin' | 'student'
	sectionName: string
	answers: ResultAnswer[]
	testCorrectAnswers?: CorrectAnswersStructure | null
	onToggleCorrectness?: (questionIndex: number) => void
}

export function ResultAnswerGrid({ mode, sectionName, answers, testCorrectAnswers, onToggleCorrectness }: Props) {
	const rows = buildQuestionRows(sectionName, answers)
	const correctCount = countCorrectRows(rows)
	const totalQuestions = sectionName === 'Listening' || sectionName === 'Reading' ? 40 : rows.length

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex flex-wrap items-center gap-2'>
					{sectionName === 'Listening' ? 'Listening Section' : 'Reading Section'}
					<Badge variant='secondary'>{totalQuestions} Questions</Badge>
					<Badge variant={correctCount === totalQuestions ? 'default' : 'outline'}>
						{correctCount}/{totalQuestions} Correct
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
					{rows.map((row, index) => (
						<div key={row.questionNumber} className='space-y-2 rounded-md border p-3'>
							<div className='flex items-center justify-between gap-2'>
								<label className='text-sm font-medium'>Question {row.questionNumber}</label>
								{mode === 'admin' ? (
									<button
										type='button'
										onClick={() => onToggleCorrectness?.(index)}
										className={`flex size-7 items-center justify-center rounded border-2 transition-colors ${
											row.isCorrect === true
												? 'border-green-600 bg-green-600 text-white'
												: row.isCorrect === false
													? 'border-red-600 bg-red-600 text-white'
													: 'border-gray-300 hover:border-gray-400'
										}`}
									>
										{row.isCorrect === true && <CheckCircle className='size-4' />}
										{row.isCorrect === false && <X className='size-4' />}
									</button>
								) : (
									<Badge variant={row.isCorrect === true ? 'default' : row.isCorrect === false ? 'destructive' : 'outline'}>
										{row.isCorrect === true ? 'Correct' : row.isCorrect === false ? 'Wrong' : 'Not checked'}
									</Badge>
								)}
							</div>

							{row.hasUserAnswer ? (
								<Input
									value={row.userAnswer}
									readOnly
									className={
										row.isCorrect === true
											? 'border-green-200 bg-green-50'
											: row.isCorrect === false
												? 'border-red-200 bg-red-50'
												: 'bg-muted/40'
									}
								/>
							) : (
								<div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800'>
									Not answered
								</div>
							)}

							{mode === 'admin' && testCorrectAnswers && (
								<div className='text-xs italic text-muted-foreground'>
									Correct answer:{' '}
									{getCorrectAnswerForDisplay(row.questionNumber, testCorrectAnswers, sectionName) || 'Not available'}
								</div>
							)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
