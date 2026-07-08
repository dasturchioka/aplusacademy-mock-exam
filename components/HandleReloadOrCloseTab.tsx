'use client'

import { abandonExamAttempt } from '@/lib/examAttemptClient'
import { AnswerStorage, clearVisibleExamState } from '@/lib/answerHandlers'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const GUARDED_EXAM_PATHS = new Set(['/exam/listening', '/exam/reading', '/exam/writing'])
const LEAVE_EXAM_MESSAGE =
	'Leaving now will end this exam attempt. You will need a new approval before you can enter again. Leave anyway?'

export default function HandleReloadOrCloseTab() {
	const pathname = usePathname()

	useEffect(() => {
		if (!pathname) return
		if (!GUARDED_EXAM_PATHS.has(pathname)) return

		const protectedUrl = window.location.href

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault()
			event.returnValue = ''
			return ''
		}

		const abandonAndLeave = async (destination: string) => {
			const attemptId = AnswerStorage.getAttemptId()
			if (!attemptId) {
				window.location.assign(destination)
				return
			}

			try {
				await abandonExamAttempt(attemptId)
				clearVisibleExamState()
				window.location.assign(destination)
			} catch (error) {
				window.alert('Could not end your exam attempt. Stay on this page and try again.')
			}
		}

		const handlePopState = (event: PopStateEvent) => {
			event.stopImmediatePropagation()
			window.history.pushState({ examGuard: true }, '', protectedUrl)

			if (window.confirm(LEAVE_EXAM_MESSAGE)) {
				window.removeEventListener('beforeunload', handleBeforeUnload)
				void abandonAndLeave('/student')
				return
			}
		}

		const handleDocumentClick = (event: MouseEvent) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return
			}

			const target = event.target
			if (!(target instanceof Element)) return

			const anchor = target.closest('a[href]')
			if (!(anchor instanceof HTMLAnchorElement)) return
			if (anchor.target && anchor.target !== '_self') return

			const nextUrl = new URL(anchor.href)
			if (nextUrl.origin !== window.location.origin) return
			if (GUARDED_EXAM_PATHS.has(nextUrl.pathname)) return

			event.preventDefault()
			event.stopPropagation()

			if (window.confirm(LEAVE_EXAM_MESSAGE)) {
				window.removeEventListener('beforeunload', handleBeforeUnload)
				void abandonAndLeave(nextUrl.href)
			}
		}

		window.history.pushState({ examGuard: true }, '', protectedUrl)
		window.addEventListener('beforeunload', handleBeforeUnload)
		window.addEventListener('popstate', handlePopState, true)
		document.addEventListener('click', handleDocumentClick, true)

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
			window.removeEventListener('popstate', handlePopState, true)
			document.removeEventListener('click', handleDocumentClick, true)
		}
	}, [pathname])

	return null
}
