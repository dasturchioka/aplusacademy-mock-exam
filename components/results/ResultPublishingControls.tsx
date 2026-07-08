'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lock, Unlock } from 'lucide-react'
import type { ResultDetail } from '@/lib/resultAnalysis'

type PublishingAction = 'publish_scores' | 'unpublish_scores' | 'publish_analysis' | 'unpublish_analysis'

type Props = {
	result: ResultDetail
	isUpdating: boolean
	onAction: (action: PublishingAction) => void
	disabledReason?: string | null
}

export function ResultPublishingControls({ result, isUpdating, onAction, disabledReason }: Props) {
	const isDisabled = Boolean(disabledReason)
	const canPublishScores = result.overall_score !== null && result.overall_score !== undefined
	const canPublishAnalysis = result.is_published && !isDisabled

	return (
		<Card>
			<CardHeader>
				<CardTitle>Publishing</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				<Alert>
					<AlertDescription>
						{disabledReason ||
							'Publishing analysis exposes student answers and correct/incorrect state. It does not expose correct answer values to students.'}
					</AlertDescription>
				</Alert>

				<div className='flex flex-wrap gap-3'>
					{result.is_published ? (
						<Button type='button' variant='outline' disabled={isUpdating || isDisabled} onClick={() => onAction('unpublish_scores')}>
							{isUpdating ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Lock className='mr-2 size-4' />}
							Unpublish scores
						</Button>
					) : (
						<Button type='button' disabled={isUpdating || isDisabled || !canPublishScores} onClick={() => onAction('publish_scores')}>
							{isUpdating ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Unlock className='mr-2 size-4' />}
							Publish scores
						</Button>
					)}

					{result.is_analysis_published ? (
						<Button type='button' variant='outline' disabled={isUpdating || isDisabled} onClick={() => onAction('unpublish_analysis')}>
							{isUpdating ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Lock className='mr-2 size-4' />}
							Unpublish analysis
						</Button>
					) : (
						<Button type='button' variant='secondary' disabled={isUpdating || isDisabled || !canPublishAnalysis} onClick={() => onAction('publish_analysis')}>
							{isUpdating ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Unlock className='mr-2 size-4' />}
							Publish analysis
						</Button>
					)}
				</div>

				{!isDisabled && !canPublishScores && <p className='text-sm text-muted-foreground'>Overall score is required before score publishing.</p>}
				{!isDisabled && !canPublishAnalysis && <p className='text-sm text-muted-foreground'>Scores must be published before analysis publishing.</p>}
			</CardContent>
		</Card>
	)
}
