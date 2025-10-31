import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface NavigationControlsProps {
	currentPart: number
	totalParts: number
	onNext: () => void
	onPrevious: () => void
	onComplete: () => void
	showComplete: boolean
}

export function NavigationControls({
	currentPart,
	totalParts,
	onNext,
	onPrevious,
	onComplete,
	showComplete,
}: NavigationControlsProps) {
	return (
		<Card className='p-4'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Button
						variant='outline'
						onClick={onPrevious}
						disabled={currentPart === 1}
						className='flex items-center gap-2'
					>
						<ChevronLeft className='w-4 h-4' />
						Previous Passage
					</Button>
				</div>

				<div className='flex items-center gap-2'>
					<span className='text-sm text-gray-600'>
						Passage {currentPart} of {totalParts}
					</span>
				</div>

				<div className='flex items-center gap-4'>
					{showComplete ? (
						<Button
							onClick={onComplete}
							className='flex items-center gap-2 bg-green-600 hover:bg-green-700'
						>
							<CheckCircle className='w-4 h-4' />
							Complete Test
						</Button>
					) : (
						<Button
							onClick={onNext}
							disabled={currentPart === totalParts}
							className='flex items-center gap-2'
						>
							Next Passage
							<ChevronRight className='w-4 h-4' />
						</Button>
					)}
				</div>
			</div>
		</Card>
	)
}
