import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Clock, Target } from 'lucide-react'

interface TaskContentProps {
	taskData: any
	answer: any
	updateAnswer: (taskId: string, content: string) => void
}

export function TaskContent({ taskData, answer, updateAnswer }: TaskContentProps) {
	if (!taskData) return null

	const taskId = `writing-1-${taskData.part}-task${taskData.part}`
	const minWords = taskData.part === 1 ? 150 : 250
	const currentWordCount = answer?.wordCount || 0

	return (
		<div className='space-y-6'>
			{/* Task Header */}
			<div className='border-b pb-4'>
				<div className='flex items-center justify-between mb-2'>
					<h2 className='text-xl font-bold'>{taskData.title}</h2>
					<div className='flex items-center gap-2'>
						<Badge variant='outline' className='flex items-center gap-1'>
							<Clock className='w-3 h-3' />
							{taskData.timeLimit}
						</Badge>
						<Badge variant='outline' className='flex items-center gap-1'>
							<Target className='w-3 h-3' />
							{taskData.wordLimit}
						</Badge>
					</div>
				</div>
				{taskData.instructions && <p className='text-sm text-gray-600'>{taskData.instructions}</p>}
			</div>

			{/* Task Content */}
			<div className='space-y-4'>
				{/* Task 1 - Show visual if available */}
				{taskData.part === 1 && taskData.task?.image && (
					<Card className='p-4'>
						<div className='text-center'>
							<h4 className='font-semibold mb-3'>{taskData.task.title}</h4>
							<img
								src={taskData.task.image.base64}
								alt={taskData.task.image.headline}
								className='max-w-full h-auto mx-auto rounded-lg'
							/>
						</div>
					</Card>
				)}

				{/* Task Instructions */}
				{taskData.task?.instructions && (
					<Card className='p-4 bg-blue-50 border-blue-200'>
						<p className='text-sm text-blue-900 font-medium'>{taskData.task.instructions}</p>
					</Card>
				)}

				{/* Task Prompt */}
				{taskData.task?.prompt && (
					<Card className='p-4 bg-gray-50'>
						<p className='text-sm font-medium leading-relaxed'>{taskData.task.prompt}</p>
					</Card>
				)}

				{/* Writing Area */}
				<div className='space-y-2'>
					<div className='flex items-center justify-between'>
						<Label className='text-sm font-medium'>Your Response</Label>
						<div className='flex items-center gap-2 text-xs text-gray-500'>
							<span>
								Words: {currentWordCount}/{minWords}
							</span>
							<div
								className={`w-2 h-2 rounded-full ${
									currentWordCount >= minWords ? 'bg-green-500' : 'bg-yellow-500'
								}`}
							/>
						</div>
					</div>
					<Textarea
						placeholder={`Write your response here... (minimum ${minWords} words)`}
						value={answer?.content || ''}
						onChange={e => updateAnswer(taskId, e.target.value)}
						className='min-h-[400px] resize-none'
						spellCheck={false}
					/>
				</div>

				{/* Writing Guidelines */}
				<Card className='p-4 bg-yellow-50 border-yellow-200'>
					<h4 className='font-semibold text-yellow-900 mb-2'>Writing Guidelines:</h4>
					<ul className='text-sm text-yellow-800 space-y-1'>
						{taskData.part === 1 ? (
							<>
								<li>• Summarize the information by selecting and reporting main features</li>
								<li>• Make comparisons where relevant</li>
								<li>• Write at least 150 words</li>
								<li>• Use formal language</li>
								<li>• Do not give opinions</li>
							</>
						) : (
							<>
								<li>• Present a clear position throughout your response</li>
								<li>• Support your ideas with relevant examples</li>
								<li>• Write at least 250 words</li>
								<li>• Use formal language</li>
								<li>• Organize your ideas clearly</li>
							</>
						)}
					</ul>
				</Card>
			</div>
		</div>
	)
}
