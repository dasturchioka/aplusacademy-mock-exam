import { Badge } from '@/components/ui/badge'
import { Bell, Clock, Menu, Volume2, Wifi } from 'lucide-react'

interface ListeningHeaderProps {
	audioPlaying: boolean
	timeRemaining: number
	formatTime: (seconds: number) => string
}

export function ListeningHeader({ audioPlaying, timeRemaining, formatTime }: ListeningHeaderProps) {
	return (
		<header className='bg-white border-b border-gray-200 px-6 py-4'>
			<div className='flex items-center justify-between max-w-6xl mx-auto'>
				{/* Left side - IELTS Logo */}
				<div className='flex items-center space-x-4'>
					<div className='flex items-center space-x-2'>
						<div className='w-8 h-8 bg-[#D32F2F] rounded flex items-center justify-center'>
							<span className='text-white font-bold text-sm'>I</span>
						</div>
						<span className='font-bold text-lg text-[#D32F2F]'>IELTS</span>
					</div>

					{/* Test Taker ID */}
					<div className='ml-8 text-sm text-gray-600'>
						<span className='font-medium'>Test Taker ID:</span>
						<span className='ml-2 font-mono'>CD123456</span>
					</div>
				</div>

				{/* Center - Audio Status */}
				<div className='flex items-center space-x-4'>
					<div className='flex items-center space-x-2'>
						<Volume2 className={`w-5 h-5 ${audioPlaying ? 'text-[#D32F2F]' : 'text-gray-400'}`} />
						<span
							className={`text-sm font-medium ${audioPlaying ? 'text-[#D32F2F]' : 'text-gray-500'}`}
						>
							{audioPlaying ? 'Audio is playing' : 'Audio paused'}
						</span>
					</div>

					{/* Timer */}
					<div className='flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded'>
						<Clock className='w-4 h-4 text-gray-600' />
						<span className='text-sm font-mono font-medium'>{formatTime(timeRemaining)}</span>
					</div>
				</div>

				{/* Right side - Status Icons */}
				<div className='flex items-center space-x-4'>
					<div className='flex items-center space-x-2'>
						<Wifi className='w-5 h-5 text-green-500' />
						<span className='text-xs text-gray-500'>Connected</span>
					</div>

					<Bell className='w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer' />

					<Menu className='w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer' />
				</div>
			</div>

			{/* Section Indicator */}
			<div className='mt-3 max-w-6xl mx-auto'>
				<div className='flex items-center space-x-4'>
					<Badge variant='outline' className='bg-[#D32F2F] text-white border-[#D32F2F]'>
						Listening
					</Badge>
					<span className='text-sm text-gray-600'>Complete all 4 parts within the time limit</span>
				</div>
			</div>
		</header>
	)
}
