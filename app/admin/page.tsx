'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { defaultInstance as axios } from '@/http/index'
import { BarChart3, CheckSquare, Clock, FileText, RefreshCw, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

interface DashboardStats {
	users: number
	tests: number
	results: number
	pendingApprovals: number
	activeSessions: number
}

interface RecentActivity {
	id: string
	type: 'user_created' | 'test_completed' | 'approval_requested' | 'system'
	message: string
	timestamp: string
	status: 'success' | 'warning' | 'info'
}

export default function AdminDashboard() {
	const [stats, setStats] = useState<DashboardStats>({
		users: 0,
		tests: 0,
		results: 0,
		pendingApprovals: 0,
		activeSessions: 0,
	})
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		fetchDashboardData()
	}, [])

	const fetchDashboardData = async () => {
		try {
			setLoading(true)
			setError('')

			// Fetch all dashboard data in parallel
			const [usersRes, testsRes, resultsRes, approvalsRes] = await Promise.allSettled([
				axios.get('/api/users/count'),
				axios.get('/api/tests'),
				axios.get('/api/results/count'),
				axios.get('/api/approvals'),
			])

			const newStats: DashboardStats = {
				users: 0,
				tests: 0,
				results: 0,
				pendingApprovals: 0,
				activeSessions: 0,
			}

			// Process users data
			if (usersRes.status === 'fulfilled' && usersRes.value.data.success) {
				newStats.users = usersRes.value.data.count
			}

			// Process tests data
			if (testsRes.status === 'fulfilled' && testsRes.value.data.success) {
				newStats.tests = testsRes.value.data.tests.length
			}

			// Process results data
			if (resultsRes.status === 'fulfilled' && resultsRes.value.data.success) {
				newStats.results = resultsRes.value.data.count
			}

			// Process approvals data
			if (approvalsRes.status === 'fulfilled' && approvalsRes.value.data.success) {
				const approvals = approvalsRes.value.data.approvals
				newStats.pendingApprovals = approvals.filter((a: any) => a.status === 'pending').length
			}

			setStats(newStats)

			// Generate recent activity based on real data
			const activity: RecentActivity[] = [
				{
					id: '1',
					type: 'system',
					message: `${newStats.users} users registered in system`,
					timestamp: new Date().toISOString(),
					status: 'info',
				},
				{
					id: '2',
					type: 'approval_requested',
					message: `${newStats.pendingApprovals} pending approval requests`,
					timestamp: new Date().toISOString(),
					status: newStats.pendingApprovals > 0 ? 'warning' : 'success',
				},
				{
					id: '3',
					type: 'test_completed',
					message: `${newStats.results} test results available`,
					timestamp: new Date().toISOString(),
					status: 'success',
				},
			]

			setRecentActivity(activity)
		} catch (error: any) {
			console.error('Dashboard data fetch error:', error)
			setError('Failed to load dashboard data. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	const getActivityIcon = (type: RecentActivity['type']) => {
		switch (type) {
			case 'user_created':
				return 'bg-blue-500'
			case 'test_completed':
				return 'bg-green-500'
			case 'approval_requested':
				return 'bg-yellow-500'
			case 'system':
				return 'bg-gray-500'
			default:
				return 'bg-gray-500'
		}
	}

	if (error) {
		return (
			<div className='space-y-6'>
				<Alert variant='destructive'>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
				<Button onClick={fetchDashboardData} variant='outline'>
					<RefreshCw className='h-4 w-4 mr-2' />
					Retry
				</Button>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
					<p className='mt-2 text-gray-600'>
						Welcome to the admin panel. Here's an overview of your system.
					</p>
				</div>
				<Button onClick={fetchDashboardData} disabled={loading}>
					<RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
					Refresh
				</Button>
			</div>

			<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total Users</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className='h-8 w-16' />
						) : (
							<div className='text-2xl font-bold text-primary'>{stats.users}</div>
						)}
						<p className='text-xs text-muted-foreground'>Registered users</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total Tests</CardTitle>
						<FileText className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className='h-8 w-16' />
						) : (
							<div className='text-2xl font-bold text-primary'>{stats.tests}</div>
						)}
						<p className='text-xs text-muted-foreground'>Available tests</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Test Results</CardTitle>
						<BarChart3 className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className='h-8 w-16' />
						) : (
							<div className='text-2xl font-bold text-primary'>{stats.results}</div>
						)}
						<p className='text-xs text-muted-foreground'>Completed tests</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Pending Approvals</CardTitle>
						<CheckSquare className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className='h-8 w-16' />
						) : (
							<div className='text-2xl font-bold text-primary'>{stats.pendingApprovals}</div>
						)}
						<p className='text-xs text-muted-foreground'>Awaiting approval</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Active Sessions</CardTitle>
						<Clock className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className='h-8 w-16' />
						) : (
							<div className='text-2xl font-bold text-primary'>{stats.activeSessions}</div>
						)}
						<p className='text-xs text-muted-foreground'>Currently active</p>
					</CardContent>
				</Card>
			</div>

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className='space-y-4'>
								{[1, 2, 3].map(i => (
									<div key={i} className='flex items-center space-x-4'>
										<Skeleton className='w-2 h-2 rounded-full' />
										<div className='flex-1 space-y-2'>
											<Skeleton className='h-4 w-3/4' />
											<Skeleton className='h-3 w-1/2' />
										</div>
									</div>
								))}
							</div>
						) : (
							<div className='space-y-4'>
								{recentActivity.map(activity => (
									<div key={activity.id} className='flex items-center space-x-4'>
										<div className={`w-2 h-2 ${getActivityIcon(activity.type)} rounded-full`}></div>
										<div className='flex-1'>
											<p className='text-sm font-medium'>{activity.message}</p>
											<p className='text-xs text-muted-foreground'>
												{new Date(activity.timestamp).toLocaleString()}
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							<p className='text-sm text-muted-foreground'>Use the sidebar navigation to:</p>
							<ul className='text-sm space-y-2'>
								<li>• Manage users and their access</li>
								<li>• Create and edit tests</li>
								<li>• Review exam entry approvals</li>
								<li>• View test results and analytics</li>
								<li>• Monitor system performance</li>
							</ul>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
