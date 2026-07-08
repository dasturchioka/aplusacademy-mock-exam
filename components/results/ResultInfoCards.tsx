'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { BookOpen, User } from 'lucide-react'
import type { ResultDetail } from '@/lib/resultAnalysis'
import { formatResultDate } from '@/lib/resultAnalysis'

type Props = {
	result: ResultDetail
	mode: 'admin' | 'student'
}

export function ResultInfoCards({ result, mode }: Props) {
	const lifecycleStatus = result.status || 'completed'
	const attempt = result.attempt

	return (
		<div className='grid gap-4 lg:grid-cols-2'>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<User className='size-5' />
						{mode === 'admin' ? 'Exam Taker Information' : 'Your Result'}
					</CardTitle>
				</CardHeader>
				<CardContent className='grid gap-4 sm:grid-cols-2'>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Full name</p>
						<p className='font-semibold'>{result.users?.full_name || 'Not available'}</p>
					</div>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Student ID</p>
						<p className='font-mono'>{result.exam_taker_id}</p>
					</div>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Taken</p>
						<p>{formatResultDate(result.taken_date)}</p>
					</div>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Result status</p>
						<div className='mt-1 flex flex-wrap items-center gap-2'>
							<StatusBadge
								status={lifecycleStatus === 'abandoned' ? 'abandoned' : lifecycleStatus === 'draft' ? 'draft' : 'completed'}
								label={lifecycleStatus === 'draft' && attempt?.status === 'active' ? 'Draft / active' : undefined}
							/>
							{attempt?.current_section ? (
								<span className='text-xs text-muted-foreground'>
									Current section: {attempt.current_section}
								</span>
							) : null}
						</div>
					</div>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Publishing</p>
						<div className='flex flex-wrap gap-2'>
							<Badge variant={result.is_published ? 'default' : 'secondary'}>
								{result.is_published ? 'Scores published' : 'Unpublished'}
							</Badge>
							<Badge variant={result.is_analysis_published ? 'default' : 'outline'}>
								{result.is_analysis_published ? 'Analysis published' : 'Analysis hidden'}
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BookOpen className='size-5' />
						Test Information
					</CardTitle>
				</CardHeader>
				<CardContent className='grid gap-4 sm:grid-cols-2'>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Test title</p>
						<p className='font-semibold'>{result.tests?.title || 'Mock exam'}</p>
					</div>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Edition</p>
						<p>{result.tests?.edition || 'Not available'}</p>
					</div>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Published</p>
						<p>{formatResultDate(result.published_at)}</p>
					</div>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Analysis</p>
						<p>{formatResultDate(result.analysis_published_at)}</p>
					</div>
					{attempt ? (
						<>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Attempt status</p>
								<div className='mt-1'>
									<StatusBadge
										status={
											attempt.status === 'active'
												? 'active'
												: attempt.status === 'completed'
													? 'completed'
													: attempt.status === 'abandoned'
														? 'abandoned'
														: 'neutral'
										}
										label={attempt.status}
									/>
								</div>
							</div>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Last activity</p>
								<p>{formatResultDate(attempt.last_activity_at)}</p>
							</div>
						</>
					) : null}
				</CardContent>
			</Card>
		</div>
	)
}
