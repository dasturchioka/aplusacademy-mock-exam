'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ApprovalResponse, UserSession } from '@/types/db'
import { getUserSession, setUserSession } from '@/utils/checkAuth'
import { CheckCircle, Clock, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { defaultInstance as axios } from '@/http'

export default function QueuePage() {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [userSession, setUserSessionState] = useState<UserSession | null>(null)

	useEffect(() => {
		const session = getUserSession()
		if (!session) {
			window.location.href = '/auth/user/enter-id'
			return
		}
		setUserSessionState(session)

		// Auto-check approval status every 5 seconds
		const interval = setInterval(checkApprovalStatus, 5000)
		return () => clearInterval(interval)
	}, [])

	const checkApprovalStatus = async () => {
		const session = getUserSession()
		if (!session) return

		try {
			const response = await axios.post('/api/users/send-approval', { studentId: session.id })

			const data: ApprovalResponse = await response.data

			if (response && data.approved) {
				// Update session and redirect
				setUserSession({
					...session,
					approved: true,
				})
				window.location.href = '/exam/start'
			}
		} catch (error) {
			console.error('Error checking approval:', error)
		}
	}

	const handleManualCheck = async () => {
		setError('')
		setLoading(true)

		try {
			await checkApprovalStatus()
		} catch (error) {
			setError('Error checking approval status. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	const handleLogout = () => {
		sessionStorage.removeItem('user')
		window.location.href = '/auth/user/enter-id'
	}

	if (!userSession) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<Loader2 className='h-8 w-8 animate-spin' />
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
			<Card className='w-full max-w-md p-8'>
				<div className='text-center mb-8'>
					<div className='mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4'>
						<Clock className='h-8 w-8 text-yellow-600' />
					</div>
					<h1 className='text-2xl font-bold text-gray-900 mb-2'>Waiting for Approval</h1>
					<p className='text-gray-600'>Your exam entry request is being reviewed</p>
				</div>

				<div className='space-y-4 mb-6'>
					<div className='bg-blue-50 rounded-lg p-4'>
						<div className='flex items-center'>
							<div className='flex-shrink-0'>
								<CheckCircle className='h-5 w-5 text-blue-600' />
							</div>
							<div className='ml-3'>
								<p className='text-sm font-medium text-blue-900'>ID Verified</p>
								<p className='text-sm text-blue-700'>Student ID: {userSession.id}</p>
							</div>
						</div>
					</div>

					<div className='bg-yellow-50 rounded-lg p-4'>
						<div className='flex items-center'>
							<div className='flex-shrink-0'>
								<Clock className='h-5 w-5 text-yellow-600 animate-pulse' />
							</div>
							<div className='ml-3'>
								<p className='text-sm font-medium text-yellow-900'>Pending Approval</p>
								<p className='text-sm text-yellow-700'>
									Please wait while an administrator reviews your request
								</p>
							</div>
						</div>
					</div>
				</div>

				{error && (
					<Alert variant='destructive' className='mb-4'>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className='space-y-3'>
					<Button
						onClick={handleManualCheck}
						className='w-full bg-blue-600 hover:bg-blue-700'
						disabled={loading}
					>
						{loading ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Checking...
							</>
						) : (
							'Check Approval Status'
						)}
					</Button>

					<Button onClick={handleLogout} variant='outline' className='w-full'>
						Use Different ID
					</Button>
				</div>

				<div className='mt-6 text-center text-sm text-gray-500'>
					<p>The system automatically checks your status every 5 seconds</p>
				</div>
			</Card>
		</div>
	)
}
