'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
	const pathname = usePathname()

	return (
		<div key={pathname} className='product-surface-enter'>
			{children}
		</div>
	)
}
