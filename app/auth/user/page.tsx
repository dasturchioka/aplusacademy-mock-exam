'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/app/layouts/AuthLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UserLoginPage() {
	const [userId, setUserId] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 300))

		// Save user ID to localStorage
		localStorage.setItem('userId', userId)

		// Redirect to home page
		router.push('/exam')

		setIsLoading(false)
	}

	useEffect(() => {
		async function checkUserSession() {
			const session = sessionStorage.getItem('session')

			if (session && JSON.parse(session as string) && JSON.parse(session as string).userId) {
				router.push('/exam')
			}

			return
		}

		checkUserSession()
	}, [])

	return (
		<AuthLayout title='User Login' subtitle='Enter your user ID to continue'>
			<Card>
				<CardHeader>
					<CardTitle className='text-center'>User Access</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='userId'>User ID</Label>
							<Input
								id='userId'
								type='text'
								value={userId}
								onChange={e => setUserId(e.target.value)}
								placeholder='Enter your user ID'
								required
								disabled={isLoading}
							/>
						</div>

						<Button type='submit' className='w-full' disabled={isLoading || !userId.trim()}>
							{isLoading ? 'Signing in...' : 'Sign In'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</AuthLayout>
	)
}
