'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { requireExamAccess } from '@/utils/checkAuth'
import { CheckCircle, Clock, FileText, Lock, PenTool, PlayCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SectionState {
	current: 'Listening' | 'Reading' | 'Writing'
	unlocked: {
		Listening: boolean
		Reading: boolean
		Writing: boolean
	}
	timeLeft: {
		Listening: number
		Reading: number
		Writing: number
	}
	completed: {
		Listening: boolean
		Reading: boolean
		Writing: boolean
	}
}

export default function ExamPage() {
	const router = useRouter()
	const [sectionState, setSectionState] = useState<SectionState>({
		current: 'Listening',
		unlocked: {
			Listening: true,
			Reading: false,
			Writing: false,
		},
		timeLeft: {
			Listening: 30 * 60, // 30 minutes for listening
			Reading: 60 * 60, // 60 minutes for reading
			Writing: 60 * 60, // 60 minutes for writing
		},
		completed: {
			Listening: false,
			Reading: false,
			Writing: false,
		},
	})

	// Add authentication check
	useEffect(() => {
		requireExamAccess()
	}, [])

	// Timer effect
	useEffect(() => {
		const timer = setInterval(() => {
			setSectionState(prev => {
				const newState = { ...prev }

				// Decrease time for current section
				if (newState.timeLeft[prev.current] > 0) {
					newState.timeLeft[prev.current] -= 1
				}

				// Check if current section time is up
				if (newState.timeLeft[prev.current] === 0) {
					// Mark current section as completed
					newState.completed[prev.current] = true

					// Unlock next section and auto-advance
					if (prev.current === 'Listening' && !newState.unlocked.Reading) {
						newState.unlocked.Reading = true
						newState.current = 'Reading'
					} else if (prev.current === 'Reading' && !newState.unlocked.Writing) {
						newState.unlocked.Writing = true
						newState.current = 'Writing'
					}
				}

				return newState
			})
		}, 1000)

		return () => clearInterval(timer)
	}, [])

	// Format time for display
	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600)
		const minutes = Math.floor((seconds % 3600) / 60)
		const secs = seconds % 60
		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`
	}

	// Handle section navigation
	const handleSectionChange = (section: 'Listening' | 'Reading' | 'Writing') => {
		if (sectionState.unlocked[section]) {
			setSectionState(prev => ({
				...prev,
				current: section,
			}))
		}
	}

	// Handle start section
	const handleStartSection = (section: 'Listening' | 'Reading' | 'Writing') => {
		if (sectionState.unlocked[section]) {
			router.push(`/exam/${section.toLowerCase()}`)
		}
	}

	// Section configurations
	const sectionConfigs = {
		Listening: {
			icon: PlayCircle,
			path: '/exam/listening',
			duration: '30 minutes',
			description: 'Listen to audio recordings and answer questions',
			color: 'bg-blue-500',
		},
		Reading: {
			icon: FileText,
			path: '/exam/reading',
			duration: '60 minutes',
			description: 'Read passages and answer comprehension questions',
			color: 'bg-green-500',
		},
		Writing: {
			icon: PenTool,
			path: '/exam/writing',
			duration: '60 minutes',
			description: 'Complete two writing tasks',
			color: 'bg-purple-500',
		},
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<div className='bg-white shadow-sm border-b'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex items-center justify-between'>
						<h1 className='text-2xl font-bold text-gray-900'>IELTS Practice Test</h1>
						<div className='flex items-center gap-4'>
							<div className='flex items-center gap-2 text-sm text-gray-600'>
								<Clock className='w-4 h-4' />
								Current Section: {sectionState.current}
							</div>
							<div className='text-lg font-mono bg-gray-100 px-3 py-1 rounded'>
								{formatTime(sectionState.timeLeft[sectionState.current])}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Section Navigation */}
			<div className='container mx-auto px-4 py-6'>
				<div className='mb-8'>
					<Tabs value={sectionState.current} className='w-full'>
						<TabsList className='grid w-full grid-cols-3'>
							{Object.entries(sectionConfigs).map(([section, config]) => {
								const sectionKey = section as keyof typeof sectionConfigs
								const isLocked = !sectionState.unlocked[sectionKey]
								const isCompleted = sectionState.completed[sectionKey]
								const isCurrent = sectionState.current === sectionKey

								return (
									<TabsTrigger
										key={section}
										value={section}
										disabled={isLocked}
										onClick={() => handleSectionChange(sectionKey)}
										className={`relative ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
									>
										<div className='flex items-center gap-2'>
											{isLocked && <Lock className='w-4 h-4' />}
											{isCompleted && <CheckCircle className='w-4 h-4 text-green-500' />}
											<config.icon className='w-4 h-4' />
											{section}
										</div>
									</TabsTrigger>
								)
							})}
						</TabsList>
					</Tabs>
				</div>

				{/* Section Details */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					{Object.entries(sectionConfigs).map(([section, config]) => {
						const sectionKey = section as keyof typeof sectionConfigs
						const isLocked = !sectionState.unlocked[sectionKey]
						const isCompleted = sectionState.completed[sectionKey]
						const isCurrent = sectionState.current === sectionKey
						const timeLeft = sectionState.timeLeft[sectionKey]

						return (
							<Card key={section} className={`relative ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<config.icon className='w-5 h-5' />
										{section}
										{isLocked && <Lock className='w-4 h-4 text-gray-400' />}
										{isCompleted && <CheckCircle className='w-4 h-4 text-green-500' />}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='space-y-4'>
										<div className='text-sm text-gray-600'>
											<p>
												<strong>Duration:</strong> {config.duration}
											</p>
											<p>
												<strong>Description:</strong> {config.description}
											</p>
										</div>

										{isCurrent && (
											<div className='bg-blue-50 p-3 rounded-lg'>
												<div className='flex items-center gap-2 text-blue-700'>
													<Clock className='w-4 h-4' />
													<span className='font-semibold'>Time Remaining:</span>
													<span className='font-mono text-lg'>{formatTime(timeLeft)}</span>
												</div>
											</div>
										)}

										{isCompleted && (
											<div className='bg-green-50 p-3 rounded-lg'>
												<div className='flex items-center gap-2 text-green-700'>
													<CheckCircle className='w-4 h-4' />
													<span className='font-semibold'>Completed</span>
												</div>
											</div>
										)}

										{isLocked && (
											<div className='bg-gray-50 p-3 rounded-lg'>
												<div className='flex items-center gap-2 text-gray-500'>
													<Lock className='w-4 h-4' />
													<span className='text-sm'>Complete the previous section to unlock</span>
												</div>
											</div>
										)}

										<Button
											onClick={() => handleStartSection(sectionKey)}
											disabled={isLocked}
											className={`w-full ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
										>
											{isCompleted ? 'Review' : isCurrent ? 'Continue' : 'Start'} {section}
										</Button>
									</div>
								</CardContent>
							</Card>
						)
					})}
				</div>

				{/* Instructions */}
				<Card className='mt-8'>
					<CardHeader>
						<CardTitle>Important Instructions</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
							<div>
								<h4 className='font-semibold mb-2'>Navigation Rules:</h4>
								<ul className='list-disc list-inside space-y-1'>
									<li>You must complete each section in order</li>
									<li>Time limits are strictly enforced</li>
									<li>You cannot return to previous sections</li>
									<li>Each section will auto-advance when time expires</li>
								</ul>
							</div>
							<div>
								<h4 className='font-semibold mb-2'>Section Timing:</h4>
								<ul className='list-disc list-inside space-y-1'>
									<li>Listening: 30 minutes</li>
									<li>Reading: 60 minutes</li>
									<li>Writing: 60 minutes</li>
									<li>Total exam time: 2 hours 30 minutes</li>
								</ul>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
