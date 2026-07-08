'use client'

import PendingExamCleanupModal, {
	usePendingExamCleanupBlocker,
} from '@/components/exam/PendingExamCleanupModal'
import { AppAlert } from '@/components/ui/app-alert'
import { LoadingButton } from '@/components/ui/loading-button'
import { PageState } from '@/components/ui/page-state'
import { prepareServerExamAttempt, sectionPath, type ExamSectionName } from '@/lib/examAttemptSession'
import { getUserSession, requireExamAccess } from '@/utils/checkAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ExamPage() {
	const router = useRouter()
	const [userId, setUserId] = useState<string | null>(() => getUserSession()?.id ?? null)
	const [activeSection, setActiveSection] = useState<ExamSectionName | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isPreparing, setIsPreparing] = useState(true)
	const { isBlocked, isChecking, isResetting, error, submitAdminReset } =
		usePendingExamCleanupBlocker(userId)

	useEffect(() => {
		const session = getUserSession()
		if (!session?.id) {
			setUserId(null)
			setIsPreparing(false)
			setErrorMessage('Log in again before opening the exam.')
			return
		}

		setUserId(session.id)
		void requireExamAccess(session.id)

		let cancelled = false

		async function loadAttempt() {
			try {
				const { attempt } = await prepareServerExamAttempt(session.id)
				if (!cancelled) {
					setActiveSection(attempt.current_section as ExamSectionName)
					setErrorMessage(null)
				}
			} catch (error) {
				if (!cancelled) {
					setErrorMessage(
						error instanceof Error ? error.message : 'Failed to load the active exam attempt.'
					)
				}
			} finally {
				if (!cancelled) {
					setIsPreparing(false)
				}
			}
		}

		void loadAttempt()

		return () => {
			cancelled = true
		}
	}, [])

	if (isPreparing) {
		return (
			<div className='min-h-screen bg-background p-4 sm:p-6'>
				<div className='mx-auto max-w-3xl'>
					<PageState
						type='loading'
						title='Preparing exam...'
						description='Loading your active attempt and section access.'
					/>
				</div>
			</div>
		)
	}

	if (!activeSection || errorMessage) {
		return (
			<div className='min-h-screen bg-background p-4 sm:p-6'>
				<PendingExamCleanupModal
					isOpen={isBlocked}
					isResetting={isResetting}
					error={error}
					onSubmit={submitAdminReset}
				/>
				<div className='mx-auto max-w-3xl'>
					<PageState
						type='blocked'
						title='Exam unavailable'
						description={errorMessage || 'No active section is available for this attempt.'}
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
				<div>
					<h1 className='text-2xl font-semibold text-foreground'>Current exam</h1>
					<p className='mt-1 text-sm text-muted-foreground'>
						Continue the section assigned to your active attempt.
					</p>
				</div>
				<AppAlert tone='info' title='Section order is controlled'>
					The system opens only the section currently available for your attempt.
				</AppAlert>
				<LoadingButton
					type='button'
					onClick={() => {
						setIsPreparing(true)
						router.push(sectionPath(activeSection))
					}}
					loading={isPreparing || isChecking}
					loadingText='Preparing...'
					disabled={isBlocked || isChecking}
				>
					Continue {activeSection}
				</LoadingButton>
			</div>
		</div>
	)
}
