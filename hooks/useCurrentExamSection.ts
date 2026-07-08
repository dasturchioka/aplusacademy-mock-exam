'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

type ExamSection = 'Listening' | 'Reading' | 'Writing' | null

export function useCurrentExamSection(): ExamSection {
	const pathname = usePathname()

	return useMemo(() => {
		if (!pathname) return null

		if (pathname.includes('/exam/listening')) return 'Listening'
		if (pathname.includes('/exam/reading')) return 'Reading'
		if (pathname.includes('/exam/writing')) return 'Writing'

		return null
	}, [pathname])
}
