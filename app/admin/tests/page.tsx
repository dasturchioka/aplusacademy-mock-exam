'use client'

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import defaultInstance, { defaultInstance as axios } from '@/http/index'
import { Test } from '@/types/db'
import { Edit3, FileText, PenTool, PlayCircle, Plus, RefreshCw, Trash2, Copy, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const testTypes = [
	{ value: 'multiple-choice', label: 'Multiple Choice' },
	{ value: 'essay', label: 'Essay' },
	{ value: 'mixed', label: 'Mixed' },
]

const sections = [
	{ value: 'Listening', label: 'Listening' },
	{ value: 'Reading', label: 'Reading' },
	{ value: 'Writing', label: 'Writing' },
]

export default function AdminTestsPage() {
	const router = useRouter()
	const [tests, setTests] = useState<Test[]>([])
	const [newTestTitle, setNewTestTitle] = useState('')
	const [newTestEdition, setNewTestEdition] = useState('')
	const [newTestNumber, setNewTestNumber] = useState('')
	const [newTestSection, setNewTestSection] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [isCreating, setIsCreating] = useState(false)
	const [error, setError] = useState('')
	const [activeTestId, setActiveTestId] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [globalTestLoading, setGlobalTestLoading] = useState(false)

	useEffect(() => {
		loadTests()
	}, [])

	const loadTests = async () => {
		try {
			setIsLoading(true)
			setError('')
			const response = await axios.get('/api/tests')
			setTests(response.data.tests || [])
			setActiveTestId(response.data.activeTestId || null)
		} catch (err) {
			console.error('Error loading tests:', err)
			setError('Failed to load tests')
		} finally {
			setIsLoading(false)
		}
	}

	const deleteTest = async (testId: string) => {
		if (!confirm('Are you sure you want to delete this test?')) return

		try {
			const response = await axios.delete(`/api/tests/${testId}`)
			if (response.data.success) {
				loadTests()
			} else {
				setError(response.data.message || 'Failed to delete test')
			}
		} catch (err) {
			console.error('Error deleting test:', err)
			setError('Failed to delete test')
		}
	}

	const getSectionIcons = (test: Test) => {
		const icons: React.ReactElement[] = []
		if (test.listening)
			icons.push(<PlayCircle key='listening' className='w-4 h-4 text-muted-foreground' />)
		if (test.reading)
			icons.push(<FileText key='reading' className='w-4 h-4 text-muted-foreground' />)
		if (test.writing)
			icons.push(<PenTool key='writing' className='w-4 h-4 text-muted-foreground' />)
		return icons
	}

	const getSectionBadges = (test: Test) => {
		const badges: React.ReactElement[] = []
		if (test.listening)
			badges.push(
				<StatusBadge key='listening' status='info' label='Listening' />
			)
		if (test.reading)
			badges.push(
				<StatusBadge key='reading' status='neutral' label='Reading' />
			)
		if (test.writing)
			badges.push(
				<StatusBadge key='writing' status='neutral' label='Writing' />
			)
		return badges
	}

	const setGlobalActiveTest = async (testId: string) => {
		try {
			setGlobalTestLoading(true)
			const response = await defaultInstance.post('/api/admin/set-global-active-test', {
				test_id: testId,
			})
			if (response.data.success) loadTests()
			else setError(response.data.message || 'Failed to set active test')

			setGlobalTestLoading(false)
		} catch (err) {
			setGlobalTestLoading(false)
			console.error('Error setting active test:', err)
			setError('Failed to set active test')
		}
	}

	const filteredTests = tests.filter(test =>
		[test.title, test.edition, test.test_number?.toString()]
			.join(' ')
			.toLowerCase()
			.includes(searchTerm.toLowerCase())
	)

	return (
		<div className='container mx-auto p-6 max-w-6xl'>
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h1 className='text-3xl font-bold mb-2'>Test Management</h1>
					<p className='text-gray-600'>Create, edit, and manage IELTS practice tests</p>
				</div>

				<div className='flex gap-2'>
					<Button
						onClick={() => router.push('/admin/tests/create-test-dynamic')}
						className='bg-blue-600 hover:bg-blue-700'
					>
						<Plus className='w-4 h-4 mr-2' />
						Create Test (Dynamic)
					</Button>
				</div>
			</div>

			{error && (
				<Alert className='mb-6' variant='destructive'>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Tests List */}
			<Card className='mt-8'>
				<CardHeader className='flex flex-row items-center justify-between'>
					<CardTitle>All Tests</CardTitle>
					<div className='w-[50%] flex items-center gap-2'>
						<Input
							placeholder='🔍 Search by title, edition, or number...'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
						/>
						<Button variant='outline' size='sm' onClick={loadTests} disabled={isLoading}>
							<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='space-y-4'>
							{[...Array(3)].map((_, i) => (
								<div key={i} className='flex items-center space-x-4'>
									<Skeleton className='h-12 w-12 rounded' />
									<div className='space-y-2'>
										<Skeleton className='h-4 w-[250px]' />
										<Skeleton className='h-4 w-[200px]' />
									</div>
								</div>
							))}
						</div>
					) : tests.length === 0 ? (
						<div className='text-center py-8'>
							<FileText className='w-12 h-12 text-gray-400 mx-auto mb-4' />
							<p className='text-gray-500'>No tests found. Create your first test!</p>
						</div>
					) : (
						<div className='space-y-4'>
							{filteredTests.length === 0 ? (
								<div className='text-center py-8'>
									<FileText className='w-12 h-12 text-gray-400 mx-auto mb-4' />
									<p className='text-gray-500'>No matching tests found.</p>
								</div>
							) : (
								filteredTests.map(test => {
									const isActive = test.id === activeTestId

									return (
									<div
										key={test.id}
										className={`flex items-center justify-between rounded-lg border border-border p-4 transition-colors ${
											isActive ? 'bg-muted/30' : 'bg-background hover:bg-muted/40'
										}`}
										>
											<div className='flex items-center space-x-4'>
												<div className='flex space-x-1'>{getSectionIcons(test)}</div>
												<div>
													<h3 className='font-semibold flex items-center gap-2'>
														{test.title}
														{isActive && <StatusBadge status='active' />}
													</h3>
													<p className='text-sm text-gray-500'>
														{test.edition} - Test {test.test_number}
													</p>
													<div className='flex gap-2 mt-2'>{getSectionBadges(test)}</div>
												</div>
											</div>
											<div className='flex items-center space-x-2'>
												{isActive ? null : (
													<LoadingButton
														onClick={() => setGlobalActiveTest(test.id)}
														size='sm'
														variant='outline'
														loading={globalTestLoading}
														loadingText='Setting active...'
													>
														Set active
													</LoadingButton>
												)}

												<Button
													variant='outline'
													size='sm'
													onClick={() => router.push(`/admin/tests/create-test-dynamic?id=${test.id}`)}
													title='Edit test with full control'
												>
													<Edit3 className='w-4 h-4' />
												</Button>
												<Button variant='outline' size='sm' onClick={() => deleteTest(test.id)}>
													<Trash2 className='w-4 h-4' />
												</Button>
											</div>
										</div>
									)
								})
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
