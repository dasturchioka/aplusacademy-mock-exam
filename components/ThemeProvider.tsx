'use client'

import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		// Apply theme from localStorage on initial load
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme === 'dark') {
			document.body.classList.add('dark')
		} else {
			document.body.classList.remove('dark')
		}
	}, [])

	return <>{children}</>
}
