import HandleReloadOrCloseTab from '@/components/HandleReloadOrCloseTab'
import React from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className='layout-exam'>
			{children}
		</div>
	)
}
