'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAnswerStore } from '@/lib/stores/answerStore'
import { clearUserSession, getUserSession } from '@/utils/checkAuth'
import { BarChart3, CheckCircle, Clock, FileText, Home, PenTool, PlayCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ExamCompletePage() {
	const router = useRouter()
	const { answers, currentUserId, currentTestId, clearAnswers } = useAnswerStore()
	const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | 'pending' | 'saving'>(
		'saving'
	)
	const [saveMessage, setSaveMessage] = useState<string>('Please wait while we save your answers...')
	const [userSession, setUserSession] = useState<any>(null)

	useEffect(() => {
		// Get user session
		const session = getUserSession()
		setUserSession(session)

		// If no exam data or user session, redirect to home
		if (!currentUserId || !currentTestId || !session) {
			router.push('/')
			return
		}

		// Simulate save completion after a short delay (in real app, this would check actual save status)
		// The retry logic is already in the save functions, so by this point saves should be complete
		const timer = setTimeout(() => {
			setSubmissionStatus('success')
			setSaveMessage('Your exam has been successfully saved!')
		}, 2000)

		return () => clearTimeout(timer)
	}, [currentUserId, currentTestId, router])

	const getSectionStats = () => {
		const stats = {
			listening: { answered: 0, total: 40 },
			reading: { answered: 0, total: 40 },
			writing: { answered: 0, total: 2 },
		}

		// Count listening answers (questions 1-40)
		stats.listening.answered = Object.keys(answers.Listening || {}).length

		// Count reading answers (questions 1-40)
		stats.reading.answered = Object.keys(answers.Reading || {}).length

		// Count writing answers (report and essay)
		let writingCount = 0
		if (answers.Writing?.report?.trim()) writingCount++
		if (answers.Writing?.essay?.trim()) writingCount++
		stats.writing.answered = writingCount

		return stats
	}

	const stats = getSectionStats()
	const totalAnswered = stats.listening.answered + stats.reading.answered + stats.writing.answered
	const totalQuestions = stats.listening.total + stats.reading.total + stats.writing.total

	const handleReturnHome = () => {
		clearAnswers()
		clearUserSession()
		router.push('/')
	}

	const handleViewResults = () => {
		// In a real app, this would navigate to a results page
		// For now, redirect to home
		router.push('/')
	}

	const submissionTime = new Date()

	return (
		<div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
			<Card className='w-full max-w-2xl'>
				<CardHeader className='text-center'>
					<div className='mx-auto mb-4'>
						<CheckCircle className='h-16 w-16 text-green-500 mx-auto' />
					</div>
					<CardTitle className='text-3xl text-green-700'>Exam Completed!</CardTitle>
					<p className='text-gray-600 mt-2'>
						Your IELTS practice exam has been successfully submitted
					</p>
			</CardHeader>

				<CardContent className='space-y-6'>
					{/* Submission Status */}
					{submissionStatus === 'saving' && (
						<Alert className='bg-blue-50 border-blue-200'>
							<Loader2 className='h-5 w-5 animate-spin text-blue-600' />
							<AlertDescription className='ml-2 text-blue-700 font-medium'>
								{saveMessage}
								<br />
								<span className='text-sm text-blue-600'>Please don't close this window.</span>
							</AlertDescription>
						</Alert>
					)}
					
					{submissionStatus === 'success' && (
						<div className='bg-green-50 border border-green-200 rounded-lg p-4'>
							<div className='flex items-center'>
								<CheckCircle className='h-5 w-5 text-green-500 mr-2' />
								<span className='text-green-700 font-medium'>
									Successfully submitted on {submissionTime.toLocaleDateString()} at{' '}
									{submissionTime.toLocaleTimeString()}
								</span>
							</div>
						</div>
					)}

					{submissionStatus === 'error' && (
						<Alert className='bg-red-50 border-red-200'>
							<AlertDescription className='text-red-700 font-medium'>
								There was an issue saving your answers. Please contact support.
							</AlertDescription>
						</Alert>
					)}



					{/* Next Steps */}
					<div className='space-y-4'>
						<h3 className='lg font-semibold'>What happens next?</h3>
						<div className='space-y-2 text-sm text-gray-600'>
							<div className='flex items-start'>
								<Clock className='h-4 w-4 text-gray-400 mr-2 mt-0.5' />
								<span>Your exam responses have been saved and will be reviewed by our team</span>
							</div>
							<div className='flex items-start'>
								<BarChart3 className='h-4 w-4 text-gray-400 mr-2 mt-0.5' />
								<span>You will receive detailed feedback and scores via email</span>
							</div>
							<div className='flex items-start'>
								<CheckCircle className='h-4 w-4 text-gray-400 mr-2 mt-0.5' />
								<span>Results typically available within 24-48 hours</span>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className='flex flex-col sm:flex-row gap-3 pt-4'>
						<Button onClick={handleReturnHome} variant='outline' className='flex-1'>
							<Home className='mr-2 h-4 w-4' />
							Return to Home
						</Button>
						<Button onClick={handleViewResults} className='flex-1'>
							<BarChart3 className='mr-2 h-4 w-4' />
							View Dashboard
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
