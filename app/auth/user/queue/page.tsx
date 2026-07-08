'use client'

import AuthLayout from '@/app/layouts/AuthLayout'
import { Card, CardContent } from '@/components/ui/card'
import { PageState } from '@/components/ui/page-state'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function QueueRedirectPage() {
	const router = useRouter()

	useEffect(() => {
		router.replace('/student')
	}, [router])

	return (
		<AuthLayout title='Student Dashboard' subtitle='Redirecting to your student dashboard.'>
			<Card className='w-full'>
				<CardContent className='p-6'>
					<PageState type='loading' title='Redirecting to student dashboard' />
				</CardContent>
			</Card>
		</AuthLayout>
	)
}
