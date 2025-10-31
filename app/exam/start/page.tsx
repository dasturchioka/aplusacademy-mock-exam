'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { getUserSession, requireExamAccess } from '@/utils/checkAuth'
import { AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ExamStartPage() {
	const [showModal, setShowModal] = useState(false)
	const [userSession, setUserSessionState] = useState<any>(null)

	useEffect(() => {
		const session = getUserSession()
		requireExamAccess(session.id)
		setUserSessionState(session)
	}, [])

	const handleStartExam = () => {
		setShowModal(true)
	}

	const handleConfirmStart = () => {
		setShowModal(false)
		window.location.href = '/exam/listening'
	}

	if (!userSession) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='animate-pulse'>Loading...</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
			<Card className='w-full max-w-2xl p-8'>
				<div className='text-center mb-8'>
					<div className='mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4'>
						<Target className='h-10 w-10 text-blue-600' />
					</div>
					<h1 className='text-3xl font-bold text-gray-900 mb-2'>IELTS Mock Exam</h1>
					<p className='text-gray-600'>Welcome, Student ID: {userSession.id}</p>
				</div>

				<div className='space-y-6 mb-8'>
					<div className='bg-green-50 rounded-lg p-4'>
						<div className='flex items-center'>
							<div className='flex-shrink-0'>
								<CheckCircle className='h-5 w-5 text-green-600' />
							</div>
							<div className='ml-3'>
								<p className='text-sm font-medium text-green-900'>
									You are approved to take the exam
								</p>
							</div>
						</div>
					</div>

					<div className='bg-white rounded-lg border p-6'>
						<h2 className='text-xl font-semibold mb-4'>Test Structure</h2>
						<div className='space-y-3'>
							<div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
								<div className='flex items-center'>
									<div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3'>
										1
									</div>
									<span className='font-medium'>Listening</span>
								</div>
								<div className='flex items-center text-gray-600'>
									<Clock className='h-4 w-4 mr-1' />
									<span className='text-sm'>Audio + 2 minutes</span>
								</div>
							</div>

							<div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
								<div className='flex items-center'>
									<div className='w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3'>
										2
									</div>
									<span className='font-medium'>Reading</span>
								</div>
								<div className='flex items-center text-gray-600'>
									<Clock className='h-4 w-4 mr-1' />
									<span className='text-sm'>60 minutes</span>
								</div>
							</div>

							<div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
								<div className='flex items-center'>
									<div className='w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3'>
										3
									</div>
									<span className='font-medium'>Writing</span>
								</div>
								<div className='flex items-center text-gray-600'>
									<Clock className='h-4 w-4 mr-1' />
									<span className='text-sm'>60 minutes</span>
								</div>
							</div>
						</div>
					</div>

					<div className='bg-yellow-50 rounded-lg p-4 border border-yellow-200'>
						<div className='flex items-start'>
							<div className='flex-shrink-0'>
								<AlertTriangle className='h-5 w-5 text-yellow-600 mt-0.5' />
							</div>
							<div className='ml-3'>
								<h3 className='text-sm font-medium text-yellow-900 mb-2'>Important Rules</h3>
								<ul className='text-sm text-yellow-800 space-y-1'>
									<li>• Do not close your browser tab during the exam</li>
									<li>• You can refresh the page without losing progress</li>
									<li>• Complete all sections in the given order</li>
									<li>• Your answers are automatically saved</li>
									<li>• Once you submit a section, you cannot go back</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				<div className='text-center'>
					<Button
						onClick={handleStartExam}
						size='lg'
						className='bg-blue-600 hover:bg-blue-700 px-12 py-3 text-lg font-semibold'
					>
						Start Exam
					</Button>
				</div>

				<Dialog open={showModal} onOpenChange={setShowModal}>
					<DialogContent className='sm:max-w-md'>
						<DialogHeader>
							<DialogTitle className='text-center text-xl'>Ready to Begin?</DialogTitle>
							<DialogDescription className='text-center text-base pt-4'>
								Are you ready to score 9?
							</DialogDescription>
						</DialogHeader>
						<div className='flex flex-col gap-4 pt-4'>
							<Button
								onClick={handleConfirmStart}
								className='w-full bg-green-600 hover:bg-green-700 text-lg py-3'
							>
								Yes, I'm Ready!
							</Button>
							<Button onClick={() => setShowModal(false)} variant='outline' className='w-full'>
								Wait, I Need More Time
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</Card>
		</div>
	)
}