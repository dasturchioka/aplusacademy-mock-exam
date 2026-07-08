'use client'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useEffect, useState } from 'react'

export function ThemeSelector() {
	const [theme, setTheme] = useState('light')

	useEffect(() => {
		// Check for saved theme preference or default to light
		const savedTheme = localStorage.getItem('theme') || 'light'
		setTheme(savedTheme)

		// Apply theme on mount
		if (savedTheme === 'dark') {
			document.body.classList.add('dark')
		} else {
			document.body.classList.remove('dark')
		}
	}, [])

	const handleThemeChange = (selectedTheme: string) => {
		setTheme(selectedTheme)

		if (selectedTheme === 'dark') {
			document.body.classList.add('dark')
		} else {
			document.body.classList.remove('dark')
		}

		localStorage.setItem('theme', selectedTheme)
	}

	return (
		<Select value={theme} onValueChange={handleThemeChange}>
			<SelectTrigger className='w-24'>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value='light'>Light</SelectItem>
				<SelectItem value='dark'>Dark</SelectItem>
			</SelectContent>
		</Select>
	)
}
