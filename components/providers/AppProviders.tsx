'use client'

import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'
import type { ReactNode } from 'react'

export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider>
			{children}
			<Toaster position='top-center' />
			<ProgressBar
				height='2px'
				color='var(--primary)'
				options={{ showSpinner: false }}
				shallowRouting
			/>
		</ThemeProvider>
	)
}
