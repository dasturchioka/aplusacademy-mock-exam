import { Card } from '@/components/ui/card'
import { Clock, PenTool } from 'lucide-react'

interface WritingHeaderProps {
	timeRemaining: number
	formatTime: (seconds: number) => string
	isCompleted: boolean
}

export function WritingHeader({ timeRemaining, formatTime, isCompleted }: WritingHeaderProps) {
	const getTimeColor = () => {
		if (timeRemaining > 900) return 'text-green-600' // > 15 minutes
		if (timeRemaining > 300) return 'text-yellow-600' // > 5 minutes
		return 'text-red-600' // < 5 minutes
	}

	return (
		<div className='bg-white border-b border-gray-200 sticky top-0 z-40'>
			<div className='max-w-7xl mx-auto px-4 py-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						<div className='flex items-center gap-2'>
							<PenTool className='w-6 h-6 text-blue-600' />
							<h1 className='text-xl font-bold'>IELTS Writing Test</h1>
						</div>
						<div className='hidden sm:block text-sm text-gray-600'>60 minutes • 2 tasks</div>
					</div>

					<div className='flex items-center gap-4'>
						<Card className='px-4 py-2'>
							<div className='flex items-center gap-2'>
								<Clock className='w-4 h-4' />
								<span className={`font-mono text-lg font-bold ${getTimeColor()}`}>
									{formatTime(timeRemaining)}
								</span>
							</div>
						</Card>

						{isCompleted && (
							<div className='bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium'>
								Completed
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
