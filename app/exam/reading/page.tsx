'use client'
import ReadingSection from '@/components/exam/ReadingSection'
import { defaultInstance as axios } from '@/http/index'
import { getUserSession } from '@/utils/checkAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ReadingExamPage() {
	const router = useRouter()
	const [userId, setUserId] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const checkAccess = async () => {
			try {
				setIsLoading(true)

				// Get user session from sessionStorage
				const userSession = getUserSession()
				if (!userSession || !userSession.id) {
					throw new Error('Please log in to access the exam')
				}

				// Check if user has exam access
				const response = await axios.get(`/api/exam/access/${userSession.id}`)
				if (!response.data.success || !response.data.hasAccess) {
					throw new Error(response.data.message || 'You do not have access to take this exam')
				}

				setUserId(userSession.id)
			} catch (err: any) {
				console.error('Access check failed:', err)
				setError(err.message || 'Failed to verify exam access')
			} finally {
				setIsLoading(false)
			}
		}

		checkAccess()
	}, [])

	const handleComplete = () => {
		router.push('/exam/writing')
	}

	if (isLoading) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>Verifying exam access...</p>
				</div>
			</div>
		)
	}

	if (error || !userId) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='text-red-500 mb-4'>⚠️</div>
					<h2 className='text-xl font-semibold mb-2'>Access Denied</h2>
					<p className='text-gray-600 mb-4'>{error || 'Unable to access exam'}</p>
					<button
						onClick={() => router.push('/')}
						className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
					>
						Return Home
					</button>
				</div>
			</div>
		)
	}

	return <ReadingSection userId={userId} onComplete={handleComplete} />
}
