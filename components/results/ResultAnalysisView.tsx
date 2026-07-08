'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReactNode } from 'react'
import { ResultAnswerGrid } from './ResultAnswerGrid'
import { ResultInfoCards } from './ResultInfoCards'
import { ResultScoreSummary } from './ResultScoreSummary'
import { ResultWritingReview } from './ResultWritingReview'
import { getSectionName, type ResultAnswer, type ResultDetail, type SectionResult, type WritingAnswer } from '@/lib/resultAnalysis'

type ScoreKey = 'listening' | 'reading' | 'writing' | 'speaking' | 'overall'

type Props = {
	mode: 'admin' | 'student'
	result: ResultDetail
	sections: SectionResult[]
	testCorrectAnswers?: import('@/lib/answerEvaluation').CorrectAnswersStructure | null
	scoreValues?: Record<ScoreKey, string>
	onScoreChange?: (key: ScoreKey, value: string) => void
	task1Score?: string
	task2Score?: string
	onTask1ScoreChange?: (value: string) => void
	onTask2ScoreChange?: (value: string) => void
	onToggleCorrectness?: (sectionIndex: number, sectionName: string, questionIndex: number) => void
	renderSectionTools?: (sectionIndex: number, sectionName: string, answers: ResultAnswer[]) => ReactNode
}

export function ResultAnalysisView({
	mode,
	result,
	sections,
	testCorrectAnswers,
	scoreValues,
	onScoreChange,
	task1Score,
	task2Score,
	onTask1ScoreChange,
	onTask2ScoreChange,
	onToggleCorrectness,
	renderSectionTools,
}: Props) {
	const visibleSections = mode === 'student' && !result.is_analysis_published ? [] : sections

	return (
		<div className='space-y-6'>
			<ResultInfoCards result={result} mode={mode} />
			<ResultScoreSummary result={result} mode={mode} values={scoreValues} onChange={onScoreChange} />

			{result.feedback && (
				<Card>
					<CardHeader>
						<CardTitle>Feedback</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='whitespace-pre-wrap text-sm leading-6'>{result.feedback}</p>
					</CardContent>
				</Card>
			)}

			{mode === 'student' && !result.is_analysis_published && (
				<Alert>
					<AlertDescription>Score summary is published. Full answer analysis is not published for this result.</AlertDescription>
				</Alert>
			)}

			{visibleSections.map((sectionResult, sectionIndex) => {
				const sectionName = getSectionName(sectionResult)
				if (!sectionName) return null
				const answers = sectionResult[sectionName]

				if (sectionName === 'Writing' && Array.isArray(answers)) {
					return (
						<ResultWritingReview
							key={`${sectionName}-${sectionIndex}`}
							mode={mode}
							writingAnswers={answers as WritingAnswer[]}
							task1Score={task1Score}
							task2Score={task2Score}
							onTask1ScoreChange={onTask1ScoreChange}
							onTask2ScoreChange={onTask2ScoreChange}
						/>
					)
				}

				if ((sectionName === 'Listening' || sectionName === 'Reading') && Array.isArray(answers)) {
					const resultAnswers = answers as ResultAnswer[]
					return (
						<div key={`${sectionName}-${sectionIndex}`} className='space-y-4'>
							{renderSectionTools?.(sectionIndex, sectionName, resultAnswers)}
							<ResultAnswerGrid
								mode={mode}
								sectionName={sectionName}
								answers={resultAnswers}
								testCorrectAnswers={mode === 'admin' ? testCorrectAnswers : undefined}
								onToggleCorrectness={questionIndex => onToggleCorrectness?.(sectionIndex, sectionName, questionIndex)}
							/>
						</div>
					)
				}

				return null
			})}
		</div>
	)
}
