interface Question {
	topText?: string
	topInstructions?: string
	instructions?: string
	draggableVariants?: Array<{
		variant: string
		text: string
	}>
}

interface DividerContentProps {
	question: Question
}

export function DividerContent({ question }: DividerContentProps) {
	return (
		<div className='my-6'>
			{/* Top text (like "Questions 25-30") */}
			{question.topText && (
				<div className='bg-gray-50 p-4 rounded-lg border-l-4 border-[#D32F2F] mb-4'>
					<h4 className='font-semibold text-gray-800 mb-2'>{question.topText}</h4>

					{/* Top instructions */}
					{question.topInstructions && (
						<p className='text-sm text-gray-700 mb-2'>{question.topInstructions}</p>
					)}

					{/* Instructions */}
					{question.instructions && (
						<p className='text-sm text-gray-700 italic'>{question.instructions}</p>
					)}
				</div>
			)}

			{/* Draggable variants (for matching questions) */}
			{question.draggableVariants && (
				<div className='bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4'>
					<h5 className='font-medium text-gray-800 mb-3'>Answer choices:</h5>
					<div className='grid grid-cols-2 gap-2'>
						{question.draggableVariants.map(variant => (
							<div
								key={variant.variant}
								className='flex items-center space-x-2 p-2 bg-white rounded border border-gray-200'
							>
								<span className='font-medium text-[#D32F2F] min-w-[1.5rem]'>{variant.variant}</span>
								<span className='text-sm text-gray-700'>{variant.text}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
