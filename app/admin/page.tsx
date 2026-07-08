'use client'

import { LoadingButton } from '@/components/ui/loading-button'
import { PageState, RetryAction } from '@/components/ui/page-state'
import { defaultInstance as axios } from '@/http/index'
import { BarChart3, CheckSquare, FileText, RefreshCw, Users } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DashboardMetricCard } from './components/dashboard-metric-card'
import { DashboardShortcuts } from './components/dashboard-shortcuts'
import { DashboardSkeleton } from './components/dashboard-skeleton'
import { PendingApprovalsList } from './components/pending-approvals-list'
import { UsersGrowthChart } from './components/users-growth-chart'
import type { DashboardRange, DashboardSummary } from './dashboard-types'

export default function AdminDashboard() {
	const [range, setRange] = useState<DashboardRange>('this-year')
	const [summary, setSummary] = useState<DashboardSummary | null>(null)
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState('')
	const latestRequestIdRef = useRef(0)

	const fetchDashboardData = useCallback(
		async (nextRange: DashboardRange, showRefresh = false) => {
			const requestId = ++latestRequestIdRef.current

			try {
				if (showRefresh) setRefreshing(true)
				else setLoading(true)
				setError('')

				const response = await axios.get<DashboardSummary>('/api/admin/dashboard-summary', {
					params: { range: nextRange },
				})

				if (requestId !== latestRequestIdRef.current) return
				setSummary(response.data)
			} catch (fetchError) {
				if (requestId !== latestRequestIdRef.current) return
				console.error('Dashboard data fetch error:', fetchError)
				setSummary(null)
				setError('Dashboard data could not be loaded. Check the API server and try again.')
			} finally {
				if (requestId !== latestRequestIdRef.current) return
				setLoading(false)
				setRefreshing(false)
			}
		},
		[]
	)

	useEffect(() => {
		fetchDashboardData(range, true)
	}, [fetchDashboardData, range])

	const handleRangeChange = (nextRange: DashboardRange) => {
		setRange(nextRange)
	}

	if (error) {
		return (
			<PageState
				type='error'
				title='Dashboard unavailable'
				description={error}
				action={<RetryAction onRetry={() => fetchDashboardData(range, true)} />}
			/>
		)
	}

	if (loading || !summary) return <DashboardSkeleton />

	return (
		<div className='space-y-5'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h2 className='font-heading text-2xl font-semibold tracking-normal text-foreground'>Dashboard</h2>
					<p className='mt-1 text-sm text-muted-foreground'>
						Operational overview for users, tests, results, and approvals.
					</p>
				</div>
				<LoadingButton
					onClick={() => fetchDashboardData(range, true)}
					loading={refreshing}
					loadingText='Refreshing...'
					variant='outline'
					icon={RefreshCw}
				>
					Refresh
				</LoadingButton>
			</div>

			<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
				<DashboardMetricCard
					title='Total users'
					value={summary.metrics.users}
					description='Registered users'
					icon={Users}
				/>
				<DashboardMetricCard
					title='Total tests'
					value={summary.metrics.tests}
					description='Available tests'
					icon={FileText}
				/>
				<DashboardMetricCard
					title='Test results'
					value={summary.metrics.results}
					description='Saved results'
					icon={BarChart3}
				/>
				<DashboardMetricCard
					title='Pending approvals'
					value={summary.metrics.pendingApprovals}
					description='Waiting for access'
					icon={CheckSquare}
				/>
			</div>

			<div className='grid gap-4 xl:grid-cols-[1fr_360px]'>
				<UsersGrowthChart range={range} points={summary.userGrowth.points} onRangeChange={handleRangeChange} />
				<PendingApprovalsList approvals={summary.pendingApprovals} />
			</div>

			<DashboardShortcuts />
		</div>
	)
}
