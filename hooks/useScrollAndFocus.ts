'use client'

import { useCallback } from 'react'

/**
 * Hook to scroll to an element with a specific question number ID (qn-13)
 * and focus it if it's focusable (input, textarea, select, etc.)
 */
export function useScrollAndFocus() {
	const scrollAndFocus = useCallback((questionNumber: number, options?: ScrollIntoViewOptions) => {
		const el = document.getElementById(`qn-${questionNumber}`)

		if (!el) return

		// Scroll to the element
		el.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
			inline: 'nearest',
			...options,
		})

		el.style.transition = 'all .4s ease'
		el.style.background = '#FFFFE0'

		setTimeout(() => {
			el.style.transition = 'all .4s ease'
			el.style.background = ''
		}, 3000)

		// Try to focus it after slight delay (to allow scroll to settle)
		setTimeout(() => {
			if (
				el instanceof HTMLInputElement ||
				el instanceof HTMLTextAreaElement ||
				el instanceof HTMLSelectElement ||
				el instanceof HTMLButtonElement ||
				(el instanceof HTMLElement && el.tabIndex >= 0)
			) {
				el.focus()
			}
		}, 250)
	}, [])

	return scrollAndFocus
}
