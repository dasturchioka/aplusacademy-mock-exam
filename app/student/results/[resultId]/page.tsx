'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ResultAnalysisView } from '@/components/results/ResultAnalysisView'
import { PageState, RetryAction } from '@/components/ui/page-state'
import defaultInstance from '@/http'
import type { ResultDetail } from '@/lib/resultAnalysis'
import { ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function StudentResultDetailPage() {
	const params = useParams()
	const router = useRouter()
	const resultId = params?.resultId as string
	const [result, setResult] = useState<ResultDetail | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		async function loadResult() {
			try {
				setError('')
				setIsLoading(true)
				const response = await defaultInstance.get<{ success: boolean; result: ResultDetail }>(`/api/student/results/${resultId}`)
				setResult(response.data.result)
			} catch (error: any) {
				setError(error.response?.data?.error || 'Could not load this published result.')
			} finally {
				setIsLoading(false)
			}
		}

		if (resultId) void loadResult()
	}, [resultId])

	if (isLoading) {
		return <PageState type='loading' title='Loading result' />
	}

	if (error || !result) {
		return (
			<PageState
				type='error'
				title='Result unavailable'
				description={error || 'Result not found'}
				action={<RetryAction onRetry={() => router.push('/student/results')} label='Back to results' />}
			/>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<Button type='button' variant='outline' onClick={() => router.push('/student/results')}>
						<ArrowLeft className='mr-2 size-4' />
						Results
					</Button>
				</div>
				<div className='text-left sm:text-right'>
					<h2 className='font-heading text-2xl font-semibold'>{result.tests?.title || 'Mock exam result'}</h2>
					<p className='text-sm text-muted-foreground'>
						{result.is_analysis_published ? 'Full analysis available' : 'Score summary only'}
					</p>
				</div>
			</div>

			<ResultAnalysisView mode='student' result={result} sections={result.results || []} />

			{!result.results?.length && !result.is_analysis_published && (
				<Card>
					<CardContent className='p-6 text-sm text-muted-foreground'>
						Answer-level analysis is locked for this result. Staff can publish analysis after review.
					</CardContent>
				</Card>
			)}
		</div>
	)
}
