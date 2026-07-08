'use client'

import AuthLayout from '@/app/layouts/AuthLayout'
import { Card, CardContent } from '@/components/ui/card'
import { PageState } from '@/components/ui/page-state'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UserRedirectPage() {
	const router = useRouter()

	useEffect(() => {
		router.replace('/student/login')
	}, [router])

	return (
		<AuthLayout title='Student Sign In' subtitle='Redirecting to the student login page.'>
			<Card className='w-full'>
				<CardContent className='p-6'>
					<PageState type='loading' title='Redirecting to student sign in' />
				</CardContent>
			</Card>
		</AuthLayout>
	)
}
