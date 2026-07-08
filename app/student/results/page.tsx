'use client'

import { AppAlert } from '@/components/ui/app-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageState, RetryAction } from '@/components/ui/page-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import defaultInstance from '@/http'
import { formatResultDate } from '@/lib/resultAnalysis'
import { Eye, FileText, Loader2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type StudentResultListItem = {
	id: string
	test_id: string
	taken_date: string
	listening_score: number | null
	reading_score: number | null
	writing_score: number | null
	speaking_score: number | null
	overall_score: number | null
	status: string
	completed_at: string | null
	created_at: string
	is_published: boolean
	published_at: string | null
	is_analysis_published: boolean
	analysis_published_at: string | null
	tests?: { title?: string; edition?: string; test_number?: number } | null
}

export default function StudentResultsPage() {
	const [results, setResults] = useState<StudentResultListItem[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const router = useRouter()
	const publishedResults = results.filter(result => result.is_published)

	async function loadResults() {
		try {
			setError('')
			setIsLoading(true)
			const response = await defaultInstance.get<{ success: boolean; results: StudentResultListItem[] }>('/api/student/results')
			setResults(response.data.results || [])
		} catch (error: any) {
			setError(error.response?.data?.error || 'Could not load published results.')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		void loadResults()
	}, [])

	return (
		<div className='space-y-6'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h2 className='font-heading text-2xl font-semibold'>Results</h2>
					<p className='text-sm text-muted-foreground'>Published score summaries and analysis.</p>
				</div>
				<Button type='button' variant='outline' onClick={() => void loadResults()} disabled={isLoading}>
					{isLoading ? <Loader2 className='mr-2 size-4 animate-spin' /> : <RefreshCw className='mr-2 size-4' />}
					Refresh
				</Button>
			</div>

			{error && (
				<AppAlert tone='error' title='Results unavailable'>
					<div className='flex flex-col gap-3'>
						<p>{error}</p>
						<div>
							<RetryAction onRetry={() => void loadResults()} />
						</div>
					</div>
				</AppAlert>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Published results</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<PageState type='loading' title='Loading results' />
					) : publishedResults.length ? (
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Test</TableHead>
										<TableHead>Taken</TableHead>
										<TableHead>Publication</TableHead>
										<TableHead>Overall</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className='text-right'>Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{publishedResults.map(result => (
										<TableRow key={result.id}>
											<TableCell>
												<p className='font-medium'>{result.tests?.title || 'Mock exam'}</p>
												<p className='text-sm text-muted-foreground'>{result.tests?.edition || 'No edition'}</p>
											</TableCell>
											<TableCell>{formatResultDate(result.taken_date)}</TableCell>
											<TableCell>
												<div className='flex flex-wrap gap-2'>
													<StatusBadge status={result.is_published ? 'published' : 'unpublished'} />
													<StatusBadge
														status={result.is_analysis_published ? 'analysis-published' : 'neutral'}
														label={result.is_analysis_published ? 'Analysis' : 'Scores only'}
													/>
												</div>
												<p className='mt-2 text-sm text-muted-foreground'>{formatResultDate(result.published_at)}</p>
											</TableCell>
											<TableCell className='font-semibold'>{result.overall_score ?? 'Pending'}</TableCell>
											<TableCell>
												<StatusBadge status={result.status === 'completed' ? 'completed' : result.status || 'neutral'} />
											</TableCell>
											<TableCell className='text-right'>
												<Button type='button' variant='outline' size='sm' onClick={() => router.push(`/student/results/${result.id}`)}>
													<Eye className='mr-2 size-4' />
													View
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className='flex items-center gap-3 rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
							<FileText className='size-4' />
							No published results yet.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
