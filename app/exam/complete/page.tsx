'use client'

import { AppAlert } from '@/components/ui/app-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageState } from '@/components/ui/page-state'
import { clearVisibleExamState } from '@/lib/answerHandlers'
import { deleteJobsForAttempt } from '@/lib/examSaveQueue'
import { useAnswerStore } from '@/lib/stores/answerStore'
import { clearUserSession, getUserSession } from '@/utils/checkAuth'
import { BarChart3, CheckCircle, Clock, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function ExamCompletePage() {
	const router = useRouter()
	const { answers, currentUserId, currentTestId, clearAnswers } = useAnswerStore()
	const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | 'saving'>('saving')
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [clientAttemptId, setClientAttemptId] = useState<string | null>(null)
	const submissionTime = useMemo(() => new Date(), [])

	useEffect(() => {
		const session = getUserSession()
		const completionReady = sessionStorage.getItem('ielts_exam_completion_ready') === 'true'

		if (!currentUserId || !currentTestId || !session || !completionReady) {
			router.push('/')
			return
		}

		let activeClientAttemptId: string | null = null
		const testSessionRaw = sessionStorage.getItem('ielts_test_session')
		if (testSessionRaw) {
			try {
				const testSession = JSON.parse(testSessionRaw)
				activeClientAttemptId = testSession?.clientAttemptId || null
				setClientAttemptId(activeClientAttemptId)
			} catch {
				setClientAttemptId(null)
			}
		}

		let cancelled = false

		const finishCleanup = async () => {
			let localCleanupFailed = false

			if (activeClientAttemptId) {
				try {
					await deleteJobsForAttempt(activeClientAttemptId)
				} catch {
					localCleanupFailed = true
				}
			}

			clearVisibleExamState()
			clearAnswers()

			if (cancelled) {
				return
			}

			if (localCleanupFailed) {
				setSubmissionStatus('error')
				setErrorMessage(
					'Your exam was saved, but local cleanup failed. Please contact an administrator.'
				)
				return
			}

			setSubmissionStatus('success')
			setErrorMessage(null)
		}

		void finishCleanup()

		return () => {
			cancelled = true
		}
	}, [clearAnswers, currentTestId, currentUserId, router])

	const getSectionStats = () => {
		const stats = {
			listening: { answered: 0, total: 40 },
			reading: { answered: 0, total: 40 },
			writing: { answered: 0, total: 2 },
		}

		stats.listening.answered = Object.keys(answers.Listening || {}).length
		stats.reading.answered = Object.keys(answers.Reading || {}).length

		let writingCount = 0
		if (answers.Writing?.report?.trim()) writingCount++
		if (answers.Writing?.essay?.trim()) writingCount++
		stats.writing.answered = writingCount

		return stats
	}

	const stats = getSectionStats()
	const totalAnswered = stats.listening.answered + stats.reading.answered + stats.writing.answered
	const totalQuestions = stats.listening.total + stats.reading.total + stats.writing.total

	const clearCompletedExamState = async () => {
		try {
			if (clientAttemptId) {
				await deleteJobsForAttempt(clientAttemptId)
			}
		} catch {
			// Visible state must still be cleared even if IndexedDB cleanup fails.
		}

		clearVisibleExamState()
		clearAnswers()
	}

	const handleReturnHome = async () => {
		await clearCompletedExamState()
		clearUserSession()
		router.push('/')
	}

	const handleViewResults = async () => {
		await clearCompletedExamState()
		router.push('/')
	}

	if (!currentUserId || !currentTestId) {
		return (
			<div className='min-h-screen bg-background p-4 sm:p-6'>
				<div className='mx-auto max-w-3xl'>
					<PageState
						type='blocked'
						title='Completion session missing'
						description='The exam session is no longer available.'
					/>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-background p-4 sm:p-6'>
			<div className='mx-auto max-w-3xl space-y-5'>
				<Card>
					<CardHeader className='text-center'>
						<div className='mx-auto mb-3'>
							<CheckCircle className='mx-auto h-14 w-14 text-[var(--success)]' />
						</div>
						<CardTitle>Exam completed</CardTitle>
						<p className='text-sm text-muted-foreground'>
							The exam session is closed. Review the final status below before leaving this page.
						</p>
					</CardHeader>
					<CardContent className='space-y-5'>
						{submissionStatus === 'saving' ? (
							<AppAlert tone='info' title='Finalizing exam'>
								Your final answers are syncing. Keep this tab open until completion is confirmed.
							</AppAlert>
						) : null}

						{submissionStatus === 'error' && errorMessage ? (
							<AppAlert tone='error' title='Finalization failed'>
								{errorMessage}
							</AppAlert>
						) : null}

						{submissionStatus === 'success' ? (
							<AppAlert tone='success' title='Exam finalized'>
								Confirmed on {submissionTime.toLocaleDateString()} at{' '}
								{submissionTime.toLocaleTimeString()}.
							</AppAlert>
						) : null}

						<div className='grid gap-3 sm:grid-cols-3'>
							<div className='rounded-lg border p-4'>
								<p className='text-sm text-muted-foreground'>Listening</p>
								<p className='mt-1 text-lg font-semibold text-foreground'>
									{stats.listening.answered}/{stats.listening.total}
								</p>
							</div>
							<div className='rounded-lg border p-4'>
								<p className='text-sm text-muted-foreground'>Reading</p>
								<p className='mt-1 text-lg font-semibold text-foreground'>
									{stats.reading.answered}/{stats.reading.total}
								</p>
							</div>
							<div className='rounded-lg border p-4'>
								<p className='text-sm text-muted-foreground'>Writing</p>
								<p className='mt-1 text-lg font-semibold text-foreground'>
									{stats.writing.answered}/{stats.writing.total}
								</p>
							</div>
						</div>

						<div className='rounded-lg border p-4'>
							<p className='text-sm text-muted-foreground'>Total answered</p>
							<p className='mt-1 text-lg font-semibold text-foreground'>
								{totalAnswered}/{totalQuestions}
							</p>
						</div>

						<div className='space-y-2 text-sm text-muted-foreground'>
							<div className='flex items-start gap-2'>
								<Clock className='mt-0.5 size-4 shrink-0' />
								<span>Your responses have been stored for review.</span>
							</div>
							<div className='flex items-start gap-2'>
								<BarChart3 className='mt-0.5 size-4 shrink-0' />
								<span>Results remain available through the student workflow after review.</span>
							</div>
						</div>

						<div className='flex flex-col gap-3 pt-2 sm:flex-row'>
							<Button type='button' variant='outline' className='flex-1' onClick={handleReturnHome}>
								<Home className='mr-2 h-4 w-4' />
								Return to home
							</Button>
							<Button type='button' className='flex-1' onClick={handleViewResults}>
								<BarChart3 className='mr-2 h-4 w-4' />
								View dashboard
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
