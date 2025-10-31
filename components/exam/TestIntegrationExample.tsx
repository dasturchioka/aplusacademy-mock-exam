'use client'
import { QuestionHandlers } from '@/lib/answerHandlers'
import { SectionCompletion } from '@/lib/sectionCompletion'
import { useEffect, useState } from 'react'

interface TestIntegrationExampleProps {
	userId: string
	testId: string
}

export default function TestIntegrationExample({ userId, testId }: TestIntegrationExampleProps) {
	const [isInitialized, setIsInitialized] = useState(false)
	const [sessionInfo, setSessionInfo] = useState<any>(null)

	useEffect(() => {
		// Initialize test session when component mounts
		SectionCompletion.initializeTestSession(userId, testId)
		setIsInitialized(true)

		// Get session info
		const info = SectionCompletion.getSessionInfo()
		setSessionInfo(info)

		console.log('🚀 Test session initialized:', info)
	}, [userId, testId])

	// Test all question types with new format
	const simulateAnswers = () => {
		console.log('🧪 Testing all question types with new array format...')

		// Test 1: Form Completion (Part 1) - Questions 1-5
		const formCompletionHandler = QuestionHandlers.createFormCompletionHandler('Listening', 1, 5)
		const formAnswers = [
			{ number: 1, answer: 'London' },
			{ number: 2, answer: 'Business' },
			{ number: 3, answer: 'Morning' },
			{ number: 4, answer: '2 hours' },
			{ number: 5, answer: 'Certificate' },
		]
		formCompletionHandler(formAnswers)
		console.log('✅ Form completion (Q1-5) tested')

		// Test 2: Multiple Choice (Part 2) - Questions 11-15
		const multipleChoiceHandlers = [
			QuestionHandlers.createMultipleChoiceHandler('Listening', 11),
			QuestionHandlers.createMultipleChoiceHandler('Listening', 12),
			QuestionHandlers.createMultipleChoiceHandler('Listening', 13),
			QuestionHandlers.createMultipleChoiceHandler('Listening', 14),
			QuestionHandlers.createMultipleChoiceHandler('Listening', 15),
		]
		multipleChoiceHandlers[0]('A')
		multipleChoiceHandlers[1]('B')
		multipleChoiceHandlers[2]('C')
		multipleChoiceHandlers[3]('B')
		multipleChoiceHandlers[4]('A')
		console.log('✅ Multiple choice (Q11-15) tested')

		// Test 3: Map Labelling (Part 2) - Questions 16-20
		const mapLabellingHandler = QuestionHandlers.createLabellingHandler('Listening', 16, 20)
		const mapAnswers = [
			{ number: 16, answer: 'A' },
			{ number: 17, answer: 'E' },
			{ number: 18, answer: 'B' },
			{ number: 19, answer: 'F' },
			{ number: 20, answer: 'C' },
		]
		mapLabellingHandler(mapAnswers)
		console.log('✅ Map labelling (Q16-20) tested')

		// Test 4: Multiple Select (Part 3) - Questions 23-24
		const multipleSelectHandler = QuestionHandlers.createMultipleSelectHandler('Listening', 23, 24)
		multipleSelectHandler(['B', 'C']) // B goes to Q23, C goes to Q24
		console.log('✅ Multiple select (Q23-24) tested')

		// Test 5: Matching (Part 3) - Questions 25-30
		const matchingHandler = QuestionHandlers.createMatchingHandler('Listening', 25, 30)
		const matchingAnswers = [
			{ number: 25, answer: 'D' },
			{ number: 26, answer: 'A' },
			{ number: 27, answer: 'F' },
			{ number: 28, answer: 'B' },
			{ number: 29, answer: 'E' },
			{ number: 30, answer: 'C' },
		]
		matchingHandler(matchingAnswers)
		console.log('✅ Matching (Q25-30) tested')

		// Test 6: Table Completion (Part 4) - Questions 31-40
		const tableHandler = QuestionHandlers.createTableCompletionHandler('Listening', 31, 40)
		const tableAnswers = [
			{ number: 31, answer: 'economics' },
			{ number: 32, answer: 'statistics' },
			{ number: 33, answer: 'research' },
			{ number: 34, answer: 'survey' },
			{ number: 35, answer: 'analysis' },
			{ number: 36, answer: 'database' },
			{ number: 37, answer: 'computer' },
			{ number: 38, answer: 'software' },
			{ number: 39, answer: 'report' },
			{ number: 40, answer: 'conclusion' },
		]
		tableHandler(tableAnswers)
		console.log('✅ Table completion (Q31-40) tested')

		console.log('🎉 All question types tested successfully!')

		// Update session info
		const info = SectionCompletion.getSessionInfo()
		setSessionInfo(info)
	}

	const clearAnswers = () => {
		SectionCompletion.clearSection('Listening')
		const info = SectionCompletion.getSessionInfo()
		setSessionInfo(info)
		console.log('🗑️ Cleared Listening answers')
	}

	if (!isInitialized) {
		return <div>Initializing test session...</div>
	}

	return (
		<div className='max-w-2xl mx-auto p-6 space-y-6'>
			<div className='bg-blue-50 p-4 rounded-lg'>
				<h2 className='text-lg font-semibold mb-3'>Test Integration Example</h2>

				{/* Session Info */}
				<div className='bg-white p-3 rounded border text-sm'>
					<h3 className='font-medium mb-2'>Session Information:</h3>
					<div className='space-y-1 text-xs font-mono'>
						<p>
							<strong>User ID:</strong> {sessionInfo?.session?.userId}
						</p>
						<p>
							<strong>Test ID:</strong> {sessionInfo?.session?.testId}
						</p>
						<p>
							<strong>Result ID:</strong> {sessionInfo?.resultId || 'Not created yet'}
						</p>
						<p>
							<strong>Started At:</strong> {sessionInfo?.session?.startedAt}
						</p>
						<p>
							<strong>Completed Sections:</strong>{' '}
							{sessionInfo?.completedSections.join(', ') || 'None'}
						</p>
					</div>
				</div>
			</div>

			{/* Demo Controls */}
			<div className='bg-gray-50 p-4 rounded-lg space-y-3'>
				<h3 className='font-medium'>Demo Controls:</h3>

				<div className='flex gap-2'>
					<button
						onClick={simulateAnswers}
						className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
					>
						Simulate Listening Answers
					</button>

					<button
						onClick={clearAnswers}
						className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
					>
						Clear Answers
					</button>
				</div>
			</div>

			{/* Current Answers Display */}
			<div className='bg-yellow-50 p-4 rounded-lg'>
				<h3 className='font-medium mb-2'>Current Answers (localStorage):</h3>
				<div className='text-sm'>
					<pre className='bg-white p-2 rounded border text-xs overflow-auto'>
						{JSON.stringify(QuestionHandlers.getAllStoredAnswers('Listening'), null, 2)}
					</pre>
				</div>
			</div>

			{/* Section Status */}
			<div className='bg-green-50 p-4 rounded-lg'>
				<h3 className='font-medium mb-2'>Section Status:</h3>
				{['Listening', 'Reading', 'Writing'].map(section => {
					const status = SectionCompletion.getSectionStatus(section as any)
					return (
						<div key={section} className='flex justify-between items-center py-1'>
							<span className='font-medium'>{section}:</span>
							<span
								className={`text-sm px-2 py-1 rounded ${
									status.hasAnswers ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
								}`}
							>
								{status.answerCount} answers
							</span>
						</div>
					)
				})}
			</div>

			{/* Instructions */}
			<div className='bg-gray-50 p-4 rounded-lg text-sm'>
				<h3 className='font-medium mb-2'>How to Use:</h3>
				<ol className='list-decimal list-inside space-y-1'>
					<li>Click "Simulate Listening Answers" to add sample answers to localStorage</li>
					<li>Watch the "Current Answers" and "Section Status" update in real-time</li>
					<li>Section completion happens automatically on timeout in real sections</li>
					<li>Check the console for detailed logging</li>
					<li>Result ID will be created and stored for subsequent sections</li>
				</ol>
			</div>
		</div>
	)
}
