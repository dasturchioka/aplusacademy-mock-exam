'use client'

import { AppAlert } from '@/components/ui/app-alert'
import { LoadingButton } from '@/components/ui/loading-button'
import {
	getNextSectionPath,
	prepareServerExamAttempt,
	sectionPath,
	type ExamSectionName,
} from '@/lib/examAttemptSession'
import type { Test } from '@/types/db'
import { getUserSession } from '@/utils/checkAuth'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

type GateState =
	| { status: 'preparing' }
	| { status: 'ready'; userId: string; test: Test }
	| { status: 'blocked'; message: string }

type ExamSectionGateProps = {
	section: ExamSectionName
	render: (props: { userId: string; test: Test; onComplete: () => void }) => ReactNode
	onComplete?: () => void
}

export function ExamSectionGate({ section, render, onComplete }: ExamSectionGateProps) {
	const router = useRouter()
	const [state, setState] = useState<GateState>({ status: 'preparing' })

	useEffect(() => {
		let cancelled = false

		async function prepare() {
			try {
				const userSession = getUserSession()
				if (!userSession?.id) {
					throw new Error('Please log in to access the exam.')
				}

				const { attempt, test } = await prepareServerExamAttempt(userSession.id)
				const expectedPath = sectionPath(attempt.current_section)

				if (attempt.current_section !== section) {
					router.replace(expectedPath)
					return
				}

				const nextPath = getNextSectionPath(section)
				if (nextPath) {
					void router.prefetch(nextPath)
				}

				if (!cancelled) {
					setState({ status: 'ready', userId: userSession.id, test })
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to verify exam access.'
				if (!cancelled) {
					setState({ status: 'blocked', message })
				}
			}
		}

		void prepare()

		return () => {
			cancelled = true
		}
	}, [router, section])

	if (state.status === 'preparing') {
		return (
			<div className='flex min-h-screen items-center justify-center bg-background p-4'>
				<div className='w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-xs'>
					<p className='text-sm font-medium text-foreground'>Preparing exam...</p>
					<p className='mt-2 text-sm text-muted-foreground'>
						The timer will start after your exam data is ready.
					</p>
				</div>
			</div>
		)
	}

	if (state.status === 'blocked') {
		return (
			<div className='flex min-h-screen items-center justify-center bg-background p-4'>
				<div className='w-full max-w-lg space-y-4'>
					<AppAlert tone='error' title='Exam access blocked'>
						{state.message}
					</AppAlert>
					<LoadingButton type='button' variant='outline' icon={ArrowLeft} onClick={() => router.replace('/student')}>
						Return to dashboard
					</LoadingButton>
				</div>
			</div>
		)
	}

	return render({
		userId: state.userId,
		test: state.test,
		onComplete: () => {
			onComplete?.()
			const nextPath = getNextSectionPath(section)
			if (nextPath) {
				router.push(nextPath)
			}
		},
	})
}
