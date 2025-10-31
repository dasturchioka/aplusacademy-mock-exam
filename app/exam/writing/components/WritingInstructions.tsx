import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BookOpen, Clock, PenTool, Target } from 'lucide-react'

interface WritingInstructionsProps {
	onStart: () => void
}

export function WritingInstructions({ onStart }: WritingInstructionsProps) {
	return (
		<Card className='p-8 max-w-4xl'>
			<div className='text-center mb-8'>
				<div className='flex items-center justify-center gap-2 mb-4'>
					<PenTool className='w-8 h-8 text-blue-600' />
					<h1 className='text-3xl font-bold'>IELTS Writing Test</h1>
				</div>
				<p className='text-gray-600'>
					This test consists of two tasks. Read the instructions carefully before you begin.
				</p>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
				{/* Task 1 */}
				<Card className='p-6 border-blue-200 bg-blue-50'>
					<div className='flex items-center gap-2 mb-4'>
						<Badge variant='outline' className='bg-white'>
							Task 1
						</Badge>
						<div className='flex items-center gap-1 text-sm text-blue-700'>
							<Clock className='w-4 h-4' />
							20 minutes
						</div>
					</div>
					<h3 className='font-semibold mb-3'>Data Description</h3>
					<ul className='text-sm space-y-2 text-blue-800'>
						<li>• Describe a graph, chart, table, or diagram</li>
						<li>• Summarize main features and trends</li>
						<li>• Make comparisons where relevant</li>
						<li>• Write at least 150 words</li>
						<li>• Use formal language</li>
						<li>• Do not give personal opinions</li>
					</ul>
				</Card>

				{/* Task 2 */}
				<Card className='p-6 border-green-200 bg-green-50'>
					<div className='flex items-center gap-2 mb-4'>
						<Badge variant='outline' className='bg-white'>
							Task 2
						</Badge>
						<div className='flex items-center gap-1 text-sm text-green-700'>
							<Clock className='w-4 h-4' />
							40 minutes
						</div>
					</div>
					<h3 className='font-semibold mb-3'>Essay Writing</h3>
					<ul className='text-sm space-y-2 text-green-800'>
						<li>• Respond to a question or statement</li>
						<li>• Present and justify your opinion</li>
						<li>• Support ideas with examples</li>
						<li>• Write at least 250 words</li>
						<li>• Use formal language</li>
						<li>• Organize ideas clearly</li>
					</ul>
				</Card>
			</div>

			{/* General Instructions */}
			<Card className='p-6 bg-gray-50 mb-6'>
				<h3 className='font-semibold mb-3 flex items-center gap-2'>
					<BookOpen className='w-5 h-5' />
					General Instructions
				</h3>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
					<div>
						<h4 className='font-medium mb-2'>Time Management:</h4>
						<ul className='space-y-1 text-gray-700'>
							<li>• Total time: 60 minutes</li>
							<li>• Task 1: approximately 20 minutes</li>
							<li>• Task 2: approximately 40 minutes</li>
							<li>• You can switch between tasks</li>
						</ul>
					</div>
					<div>
						<h4 className='font-medium mb-2'>Writing Guidelines:</h4>
						<ul className='space-y-1 text-gray-700'>
							<li>• Write in formal academic style</li>
							<li>• Use proper grammar and spelling</li>
							<li>• Organize your ideas logically</li>
							<li>• Check your work if time permits</li>
						</ul>
					</div>
				</div>
			</Card>

			{/* Important Notes */}
			<Card className='p-4 border-yellow-200 bg-yellow-50 mb-6'>
				<h4 className='font-medium text-yellow-900 mb-2'>Important Notes:</h4>
				<ul className='text-sm text-yellow-800 space-y-1'>
					<li>• Task 2 carries more weight than Task 1</li>
					<li>• You will be penalized for writing under the minimum word count</li>
					<li>• Spell check is disabled to simulate exam conditions</li>
					<li>• Your work is automatically saved as you type</li>
					<li>• The timer will be visible throughout the test</li>
				</ul>
			</Card>

			{/* Start Button */}
			<div className='text-center'>
				<Button onClick={onStart} size='lg' className='px-8 py-3 text-lg'>
					<Target className='w-5 h-5 mr-2' />
					Are you ready to score 9?
				</Button>
				<p className='text-sm text-gray-500 mt-2'>
					Click the button above to begin your Writing test
				</p>
			</div>
		</Card>
	)
}
