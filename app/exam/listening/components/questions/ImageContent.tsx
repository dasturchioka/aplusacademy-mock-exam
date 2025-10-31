import { Card } from '@/components/ui/card'

interface Question {
	questionId?: string
	url?: string
	headline?: string
	type: string
}

interface ImageContentProps {
	question: Question
}

export function ImageContent({ question }: ImageContentProps) {
	return (
		<div className='my-6'>
			{/* Headline */}
			{question.headline && (
				<h4 className='text-lg font-semibold text-gray-800 mb-4 text-center'>
					{question.headline}
				</h4>
			)}

			{/* Image container */}
			<Card className='p-4 bg-white border-2 border-gray-200'>
				<div className='flex justify-center'>
					{question.url ? (
						<img
							src={question.url}
							alt={question.headline || 'Question image'}
							className='max-w-full h-auto rounded-lg shadow-sm'
							style={{ maxHeight: '400px' }}
						/>
					) : (
						<div className='w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center'>
							<p className='text-gray-500 text-sm'>Image not available</p>
						</div>
					)}
				</div>
			</Card>
		</div>
	)
}
