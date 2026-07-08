'use client'

import PendingExamCleanupModal, {
	usePendingExamCleanupBlocker,
} from '@/components/exam/PendingExamCleanupModal'
import { AppAlert } from '@/components/ui/app-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { PageState } from '@/components/ui/page-state'
import { StatusBadge } from '@/components/ui/status-badge'
import defaultInstance from '@/http'
import { startExamAttempt } from '@/lib/examAttemptClient'
import { getUserSession, requireExamAccess } from '@/utils/checkAuth'
import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

const sections = [
	{ name: 'Listening', duration: 'Audio + 2 minutes' },
	{ name: 'Reading', duration: '60 minutes' },
	{ name: 'Writing', duration: '60 minutes' },
]

type AccessStatus = 'checking' | 'granted' | 'denied'

export default function ExamStartPage() {
	const [showModal, setShowModal] = useState(false)
	const [userSession, setUserSessionState] = useState<any>(() => getUserSession())
	const [accessStatus, setAccessStatus] = useState<AccessStatus>('checking')
	const [startError, setStartError] = useState('')
	const [resolvedTestTitle, setResolvedTestTitle] = useState('')
	const [isStarting, setIsStarting] = useState(false)
	const { isBlocked, isChecking, isResetting, error, submitAdminReset } =
		usePendingExamCleanupBlocker(userSession?.id)

	useEffect(() => {
		let isMounted = true

		const session = getUserSession()
		if (!session?.id) {
			setUserSessionState(null)
			setAccessStatus('denied')
			return
		}

		setUserSessionState(session)

		void (async () => {
			setAccessStatus('checking')
			const hasAccess = await requireExamAccess(session.id)

			if (!isMounted) return

			if (!hasAccess) {
				setResolvedTestTitle('')
				setAccessStatus('denied')
				return
			}

			setAccessStatus('granted')

			try {
				const response = await defaultInstance.get(`/api/exam/active/${session.id}`)
				if (isMounted) {
					setResolvedTestTitle(response.data?.test?.title || '')
				}
			} catch {
				if (isMounted) {
					setResolvedTestTitle('')
				}
			}
		})()

		return () => {
			isMounted = false
		}
	}, [])

	const handleConfirmStart = async () => {
		if (accessStatus !== 'granted' || isBlocked || isChecking || !userSession?.id) {
			return
		}

		try {
			setIsStarting(true)
			setStartError('')
			const data = await startExamAttempt()
			setResolvedTestTitle(data.test?.title || resolvedTestTitle)
			setShowModal(false)
			window.location.href = '/exam/listening'
		} catch (error: any) {
			const code = error.response?.data?.code
			if (code === 'APPROVAL_REQUIRED') {
				setStartError('Approval is required for the current exam. Please request access again.')
			} else if (code === 'ACTIVE_ATTEMPT_FOR_DIFFERENT_TEST') {
				setStartError(
					'Your exam assignment changed while another attempt is active. Ask staff to resolve this before starting.'
				)
			} else if (code === 'NO_EXAM_AVAILABLE') {
				setStartError(
					'No exam is available for this ID yet. Ask staff to assign an exam or set an active exam.'
				)
			} else {
				setStartError(
					error.response?.data?.message ||
						error.response?.data?.error ||
						'Could not start the exam. Please try again.'
				)
			}
		} finally {
			setIsStarting(false)
		}
	}

	if (!userSession) {
		return (
			<div className='min-h-screen bg-background p-4 sm:p-6'>
				<div className='mx-auto max-w-3xl'>
					<PageState
						type='blocked'
						title='Student session required'
						description='Log in again before starting the exam.'
					/>
				</div>
			</div>
		)
	}

	if (accessStatus === 'checking') {
		return (
			<div className='min-h-screen bg-background p-4 sm:p-6'>
				<div className='mx-auto max-w-3xl'>
					<PageState
						type='loading'
						title='Checking exam access'
						description='Confirming your approval status before showing exam instructions.'
					/>
				</div>
			</div>
		)
	}

	if (accessStatus === 'denied') {
		return (
			<div className='min-h-screen bg-background p-4 sm:p-6'>
				<div className='mx-auto max-w-3xl'>
					<PageState
						type='blocked'
						title='Exam access not approved'
						description='You are not approved for the current exam. Ask staff to approve your access before starting.'
						action={
							<Button type='button' variant='outline' onClick={() => (window.location.href = '/student')}>
								Back to dashboard
							</Button>
						}
					/>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-background p-4 sm:p-6'>
			<PendingExamCleanupModal
				isOpen={isBlocked}
				isResetting={isResetting}
				error={error}
				onSubmit={submitAdminReset}
			/>

			<div className='mx-auto max-w-3xl space-y-5'>
				<Card>
					<CardHeader className='space-y-3'>
						<div className='flex flex-wrap items-center gap-3'>
							<CardTitle>Exam start</CardTitle>
							<StatusBadge status='approved' />
						</div>
						<div className='space-y-1 text-sm text-muted-foreground'>
							<p>Student ID: {userSession.id}</p>
							{resolvedTestTitle ? <p>Exam: {resolvedTestTitle}</p> : null}
						</div>
					</CardHeader>
					<CardContent className='space-y-5'>
						<AppAlert tone='success' title='Approved'>
							You are approved to take this exam.
						</AppAlert>

						<AppAlert tone='warning' title='Exam rules'>
							Do not close the browser tab during the exam. Section transitions are locked until
							your answers are saved.
						</AppAlert>

						<div className='rounded-lg border bg-card'>
							<div className='border-b px-4 py-3'>
								<h2 className='text-sm font-semibold text-foreground'>Section order</h2>
							</div>
							<div className='divide-y'>
								{sections.map((section, index) => (
									<div
										key={section.name}
										className='flex items-center justify-between gap-4 px-4 py-3 text-sm'
									>
										<div className='flex items-center gap-3'>
											<span className='flex size-7 items-center justify-center rounded-full border text-xs font-semibold'>
												{index + 1}
											</span>
											<span className='font-medium text-foreground'>{section.name}</span>
										</div>
										<div className='flex items-center gap-2 text-muted-foreground'>
											<Clock className='size-4' />
											<span>{section.duration}</span>
										</div>
									</div>
								))}
							</div>
						</div>

						{startError ? (
							<AppAlert tone='error' title='Unable to start exam'>
								{startError}
							</AppAlert>
						) : null}

						<Button
							type='button'
							className='w-full'
							onClick={() => setShowModal(true)}
							disabled={accessStatus !== 'granted' || isBlocked || isChecking || isStarting}
						>
							Start exam
						</Button>
					</CardContent>
				</Card>

				<Dialog open={showModal} onOpenChange={setShowModal}>
					<DialogContent className='sm:max-w-md'>
						<DialogHeader>
							<DialogTitle>Confirm exam start</DialogTitle>
							<DialogDescription className='pt-2 text-sm text-muted-foreground'>
								Starting the exam will open the Listening section. Continue only when staff has
								confirmed you are ready.
							</DialogDescription>
						</DialogHeader>
						<div className='flex flex-col gap-3 pt-2'>
							<LoadingButton
								type='button'
								onClick={handleConfirmStart}
								className='w-full'
								loading={isStarting}
								loadingText='Starting exam...'
							>
								Start exam
							</LoadingButton>
							<Button
								type='button'
								variant='outline'
								className='w-full'
								onClick={() => setShowModal(false)}
								disabled={isStarting}
							>
								Return to instructions
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
