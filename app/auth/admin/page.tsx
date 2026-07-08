'use client'

import AuthLayout from '@/app/layouts/AuthLayout'
import { AppAlert } from '@/components/ui/app-alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { getAuthUser, loginAdmin } from '@/lib/authClient'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminLoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	useEffect(() => {
		const authUser = getAuthUser()
		if (authUser?.role === 'admin') {
			router.push('/admin')
		}
	}, [router])

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		setIsLoading(true)
		setError('')

		try {
			await loginAdmin({ email, password })
			router.push('/admin')
		} catch (error: any) {
			console.error('Admin login error:', error)
			if (error.response?.data?.message) {
				setError(error.response.data.message)
			} else {
				setError('Login failed. Please try again.')
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<AuthLayout title='Admin Login' subtitle='Enter your credentials to access the admin panel'>
			<Card className='w-full'>
				<CardHeader>
					<CardTitle className='text-center'>Admin Access</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								value={email}
								onChange={event => setEmail(event.target.value)}
								placeholder='Enter email'
								required
								disabled={isLoading}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='password'>Password</Label>
							<Input
								id='password'
								type='password'
								value={password}
								onChange={event => setPassword(event.target.value)}
								placeholder='Enter password'
								required
								disabled={isLoading}
							/>
						</div>

						{error && (
							<AppAlert tone='error' title='Sign in failed'>
								{error}
							</AppAlert>
						)}

						<LoadingButton type='submit' className='w-full' loading={isLoading} loadingText='Signing in...'>
							Sign in
						</LoadingButton>
					</form>
				</CardContent>
			</Card>
		</AuthLayout>
	)
}
