'use client'

import AuthLayout from '@/app/layouts/AuthLayout'
import { AppAlert } from '@/components/ui/app-alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { clearVisibleExamState } from '@/lib/answerHandlers'
import { getAuthUser, loginStudent } from '@/lib/authClient'
import { useAnswerStore } from '@/lib/stores/answerStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function StudentLoginPage() {
	const [studentId, setStudentId] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const clearAnswers = useAnswerStore(state => state.clearAnswers)
	const router = useRouter()

	useEffect(() => {
		const authUser = getAuthUser()
		if (authUser?.role === 'student') {
			router.replace('/student')
		}
	}, [router])

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault()
		setError('')

		if (!/^\d{8}$/.test(studentId)) {
			setError('Enter an 8-digit student ID.')
			return
		}

		if (!password) {
			setError('Enter your password.')
			return
		}

		const previousUser = getAuthUser()
		if (previousUser?.id && previousUser.id !== studentId) {
			clearAnswers()
			clearVisibleExamState()
		}

		try {
			setIsLoading(true)
			await loginStudent({ studentId, password })
			router.replace('/student')
		} catch (error: any) {
			setError(error.response?.data?.message || error.response?.data?.error || 'Login failed.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<AuthLayout title='Student Login' subtitle='Enter your student ID and password'>
			<Card className='w-full'>
				<CardHeader>
					<CardTitle className='text-center'>Student Access</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='student-id'>Student ID</Label>
							<Input
								id='student-id'
								inputMode='numeric'
								maxLength={8}
								value={studentId}
								onChange={event => setStudentId(event.target.value.replace(/\D/g, '').slice(0, 8))}
								placeholder='12345678'
								disabled={isLoading}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='student-password'>Password</Label>
							<Input
								id='student-password'
								type='password'
								value={password}
								onChange={event => setPassword(event.target.value)}
								placeholder='Enter password'
								disabled={isLoading}
							/>
						</div>

						{error && (
							<AppAlert tone='error' title='Sign in failed'>
								{error}
							</AppAlert>
						)}

						<LoadingButton
							type='submit'
							className='w-full'
							loading={isLoading}
							loadingText='Signing in...'
							disabled={studentId.length !== 8 || !password}
						>
							Sign in
						</LoadingButton>
					</form>
				</CardContent>
			</Card>
		</AuthLayout>
	)
}
