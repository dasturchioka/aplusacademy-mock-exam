import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface WordCounterProps {
	currentTask: number
	answers: Record<string, any>
}

export function WordCounter({ currentTask, answers }: WordCounterProps) {
	const task1Answer = answers[`writing-1-1-task1`]
	const task2Answer = answers[`writing-1-2-task2`]

	const task1WordCount = task1Answer?.wordCount || 0
	const task2WordCount = task2Answer?.wordCount || 0

	const task1MinWords = 150
	const task2MinWords = 250

	const task1Complete = task1WordCount >= task1MinWords
	const task2Complete = task2WordCount >= task2MinWords

	return (
		<Card className='p-4'>
			<div className='flex items-center justify-between'>
				<h3 className='font-semibold'>Word Count Progress</h3>
				<div className='flex items-center gap-4'>
					{/* Task 1 */}
					<div className='flex items-center gap-2'>
						<div
							className={`w-3 h-3 rounded-full ${
								currentTask === 1 ? 'bg-blue-500' : 'bg-gray-300'
							}`}
						/>
						<span className='text-sm font-medium'>Task 1:</span>
						<Badge
							variant={task1Complete ? 'default' : 'outline'}
							className='flex items-center gap-1'
						>
							{task1Complete ? (
								<CheckCircle className='w-3 h-3' />
							) : (
								<AlertCircle className='w-3 h-3' />
							)}
							{task1WordCount}/{task1MinWords}
						</Badge>
					</div>

					{/* Task 2 */}
					<div className='flex items-center gap-2'>
						<div
							className={`w-3 h-3 rounded-full ${
								currentTask === 2 ? 'bg-blue-500' : 'bg-gray-300'
							}`}
						/>
						<span className='text-sm font-medium'>Task 2:</span>
						<Badge
							variant={task2Complete ? 'default' : 'outline'}
							className='flex items-center gap-1'
						>
							{task2Complete ? (
								<CheckCircle className='w-3 h-3' />
							) : (
								<AlertCircle className='w-3 h-3' />
							)}
							{task2WordCount}/{task2MinWords}
						</Badge>
					</div>
				</div>
			</div>

			{/* Progress bars */}
			<div className='mt-4 space-y-3'>
				<div className='space-y-1'>
					<div className='flex justify-between text-xs'>
						<span>Task 1 Progress</span>
						<span>{Math.round((task1WordCount / task1MinWords) * 100)}%</span>
					</div>
					<div className='w-full bg-gray-200 rounded-full h-2'>
						<div
							className={`h-2 rounded-full transition-all duration-300 ${
								task1Complete ? 'bg-green-500' : 'bg-blue-500'
							}`}
							style={{ width: `${Math.min((task1WordCount / task1MinWords) * 100, 100)}%` }}
						/>
					</div>
				</div>

				<div className='space-y-1'>
					<div className='flex justify-between text-xs'>
						<span>Task 2 Progress</span>
						<span>{Math.round((task2WordCount / task2MinWords) * 100)}%</span>
					</div>
					<div className='w-full bg-gray-200 rounded-full h-2'>
						<div
							className={`h-2 rounded-full transition-all duration-300 ${
								task2Complete ? 'bg-green-500' : 'bg-blue-500'
							}`}
							style={{ width: `${Math.min((task2WordCount / task2MinWords) * 100, 100)}%` }}
						/>
					</div>
				</div>
			</div>
		</Card>
	)
}
