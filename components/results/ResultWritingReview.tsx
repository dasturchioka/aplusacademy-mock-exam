'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { wordCount, type WritingAnswer } from '@/lib/resultAnalysis'

type Props = {
	mode: 'admin' | 'student'
	writingAnswers: WritingAnswer[]
	task1Score?: string
	task2Score?: string
	onTask1ScoreChange?: (value: string) => void
	onTask2ScoreChange?: (value: string) => void
}

export function ResultWritingReview({
	mode,
	writingAnswers,
	task1Score,
	task2Score,
	onTask1ScoreChange,
	onTask2ScoreChange,
}: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					Writing Section
					<Badge variant='secondary'>2 Tasks</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{writingAnswers.map((task, taskIndex) => (
					<div key={taskIndex} className='space-y-4'>
						{task.report !== undefined && (
							<div className='space-y-2'>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<h4 className='font-semibold'>Task 1 - Report</h4>
									{mode === 'admin' && (
										<div className='flex items-center gap-2'>
											<label className='text-sm'>Task 1 Score:</label>
											<Input
												type='number'
												step='0.5'
												min='0'
												max='9'
												value={task1Score || ''}
												onChange={event => onTask1ScoreChange?.(event.target.value)}
												className='w-24'
											/>
										</div>
									)}
								</div>
								<Textarea value={task.report || ''} readOnly className='min-h-[150px] bg-muted/40' placeholder='No answer provided' />
								<p className='text-sm text-muted-foreground'>{wordCount(task.report)} words</p>
							</div>
						)}

						{task.essay !== undefined && (
							<div className='space-y-2'>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<h4 className='font-semibold'>Task 2 - Essay</h4>
									{mode === 'admin' && (
										<div className='flex items-center gap-2'>
											<label className='text-sm'>Task 2 Score:</label>
											<Input
												type='number'
												step='0.5'
												min='0'
												max='9'
												value={task2Score || ''}
												onChange={event => onTask2ScoreChange?.(event.target.value)}
												className='w-24'
											/>
										</div>
									)}
								</div>
								<Textarea value={task.essay || ''} readOnly className='min-h-[200px] bg-muted/40' placeholder='No answer provided' />
								<p className='text-sm text-muted-foreground'>{wordCount(task.essay)} words</p>
							</div>
						)}
					</div>
				))}
			</CardContent>
		</Card>
	)
}
