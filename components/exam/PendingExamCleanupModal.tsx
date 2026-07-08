'use client'

import { AppAlert } from '@/components/ui/app-alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { defaultInstance as axios } from '@/http/index'
import {
	deleteAllJobs,
	deleteExpiredJobs,
	deleteJobsForAttempt,
	ExamSaveJob,
	getBlockingJobsForUser,
} from '@/lib/examSaveQueue'
import { flushAllPending } from '@/lib/examSaveRunner'
import { useCallback, useEffect, useState } from 'react'

const RETRY_INTERVAL_MS = 3000

type VerifyLocalResetResponse = {
	success?: boolean
	message?: string
}

type PendingExamCleanupModalProps = {
	isOpen: boolean
	isResetting: boolean
	error: string | null
	onSubmit: (email: string, password: string) => Promise<void>
}

export function usePendingExamCleanupBlocker(userId: string | null | undefined) {
	const [blockerJobs, setBlockerJobs] = useState<ExamSaveJob[]>([])
	const [isChecking, setIsChecking] = useState(true)
	const [isResetting, setIsResetting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [scanFailed, setScanFailed] = useState(false)
	const [checkedUserId, setCheckedUserId] = useState<string | null>(null)

	const refreshBlockers = useCallback(async (targetUserId = userId) => {
		if (!targetUserId) {
			setBlockerJobs([])
			setScanFailed(false)
			setCheckedUserId(null)
			setIsChecking(false)
			return []
		}

		await deleteExpiredJobs()
		const jobs = await getBlockingJobsForUser(targetUserId)
		setBlockerJobs(jobs)
		setScanFailed(false)
		setCheckedUserId(targetUserId)
		setIsChecking(false)
		return jobs
	}, [userId])

	useEffect(() => {
		let cancelled = false

		const runInitialCheck = async () => {
			if (!userId) {
				setBlockerJobs([])
				setScanFailed(false)
				setCheckedUserId(null)
				setIsChecking(false)
				return
			}

			setIsChecking(true)
			setError(null)

			try {
				const jobs = await deleteExpiredJobs()
					.then(() => getBlockingJobsForUser(userId))

				if (!cancelled) {
					setBlockerJobs(jobs)
					setScanFailed(false)
					setCheckedUserId(userId)
					setIsChecking(false)
				}
			} catch (scanError) {
				if (!cancelled) {
					setBlockerJobs([])
					setScanFailed(true)
					setCheckedUserId(userId)
					setIsChecking(false)
				}
			}
		}

		void runInitialCheck()

		return () => {
			cancelled = true
		}
	}, [refreshBlockers, userId])

	useEffect(() => {
		if (!userId || (blockerJobs.length === 0 && !scanFailed)) {
			return
		}

		let cancelled = false
		let timeoutId: number | undefined

		const retryCleanup = async () => {
			try {
				await flushAllPending()
			} catch {
				// Keep retrying silently while the blocker modal is open.
			}

			try {
				const jobs = await refreshBlockers()
				if (!cancelled && (jobs.length > 0 || scanFailed)) {
					timeoutId = window.setTimeout(() => {
						void retryCleanup()
					}, RETRY_INTERVAL_MS)
				}
			} catch (scanError) {
				if (!cancelled) {
					setScanFailed(true)
					timeoutId = window.setTimeout(() => {
						void retryCleanup()
					}, RETRY_INTERVAL_MS)
				}
			}
		}

		void retryCleanup()

		return () => {
			cancelled = true
			if (timeoutId) {
				window.clearTimeout(timeoutId)
			}
		}
	}, [blockerJobs.length, refreshBlockers, scanFailed, userId])

	const submitAdminReset = useCallback(
		async (email: string, password: string) => {
			if (blockerJobs.length === 0 && !scanFailed) {
				return
			}

			setError(null)
			setIsResetting(true)

			try {
				const response = await axios.post<VerifyLocalResetResponse>('/api/admin/verify-local-reset', {
					email,
					password,
				})

				if (!response.data?.success) {
					throw new Error(response.data?.message || 'Admin verification failed')
				}

				const clientAttemptIds = Array.from(new Set(blockerJobs.map(job => job.clientAttemptId)))
				if (clientAttemptIds.length > 0) {
					for (const clientAttemptId of clientAttemptIds) {
						await deleteJobsForAttempt(clientAttemptId)
					}
				} else if (scanFailed) {
					await deleteAllJobs()
				}

				await refreshBlockers()
			} catch (resetError: any) {
				if (resetError?.response?.status === 401 || resetError?.response?.status === 403) {
					setError('Invalid admin credentials')
					return
				}

				setError(
					resetError instanceof Error ? resetError.message : 'Failed to verify admin reset'
				)
			} finally {
				setIsResetting(false)
			}
		},
		[blockerJobs, refreshBlockers, scanFailed]
	)

	return {
		blockerJobs,
		error,
		isBlocked: blockerJobs.length > 0 || scanFailed,
		isChecking: Boolean(userId) && (isChecking || checkedUserId !== userId),
		isResetting,
		submitAdminReset,
	}
}

export default function PendingExamCleanupModal({
	isOpen,
	isResetting,
	error,
	onSubmit,
}: PendingExamCleanupModalProps) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	useEffect(() => {
		if (!isOpen) {
			setEmail('')
			setPassword('')
		}
	}, [isOpen])

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		await onSubmit(email.trim(), password)
	}

	if (!isOpen) {
		return null
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4'>
			<div className='w-full max-w-md rounded-lg bg-background p-6 shadow-sm'>
				<div className='space-y-4'>
					<div className='text-center'>
						<p className='text-lg font-semibold text-foreground'>Previous exam cleanup in progress</p>
					</div>
					<AppAlert tone='warning' title='Exam start is blocked'>
						Do not close this page. A new exam can start only after the previous attempt finishes
						syncing or an administrator resets the local queue.
					</AppAlert>
				</div>

				<form onSubmit={handleSubmit} className='mt-6 space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='cleanup-admin-email'>Admin email</Label>
						<Input
							id='cleanup-admin-email'
							type='email'
							value={email}
							onChange={event => setEmail(event.target.value)}
							disabled={isResetting}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='cleanup-admin-password'>Password</Label>
						<Input
							id='cleanup-admin-password'
							type='password'
							value={password}
							onChange={event => setPassword(event.target.value)}
							disabled={isResetting}
						/>
					</div>

					{error ? <p className='text-sm text-[var(--danger)]'>{error}</p> : null}

					<LoadingButton
						type='submit'
						className='w-full'
						loading={isResetting}
						loadingText='Resetting...'
						disabled={!email.trim() || !password}
					>
						Admin reset
					</LoadingButton>
				</form>
			</div>
		</div>
	)
}
