import { Button } from '@/components/ui/button'
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface NavigationControlsProps {
	currentPart: number
	onPrevious: () => void
	onNext: () => void
	onFinish: () => void
	disabled: boolean
}

export function NavigationControls({
	currentPart,
	onPrevious,
	onNext,
	onFinish,
	disabled,
}: NavigationControlsProps) {
	return (
		<div className='flex items-center justify-between p-4 bg-white border-t border-gray-200'>
			{/* Previous button */}
			<Button
				onClick={onPrevious}
				disabled={disabled || currentPart === 1}
				variant='outline'
				className='flex items-center space-x-2'
			>
				<ChevronLeft className='w-4 h-4' />
				<span>Previous</span>
			</Button>

			{/* Part indicator */}
			<div className='flex items-center space-x-2'>
				<span className='text-sm text-gray-600'>Part {currentPart} of 4</span>
			</div>

			{/* Next/Finish button */}
			{currentPart === 4 ? (
				<Button
					onClick={onFinish}
					disabled={disabled}
					className='flex items-center space-x-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white'
				>
					<CheckCircle className='w-4 h-4' />
					<span>Finish Listening</span>
				</Button>
			) : (
				<Button
					onClick={onNext}
					disabled={disabled}
					className='flex items-center space-x-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white'
				>
					<span>Next</span>
					<ChevronRight className='w-4 h-4' />
				</Button>
			)}
		</div>
	)
}
