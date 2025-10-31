interface Question {
	headline?: string
	text?: string
	type: string
}

interface StaticContentProps {
	question: Question
}

export function StaticContent({ question }: StaticContentProps) {
	return (
		<div className='space-y-2'>
			{/* Headline */}
			{question.headline && (
				<h4 className='text-lg font-semibold text-gray-800 mt-4'>{question.headline}</h4>
			)}

			{/* Static text */}
			{question.text && (
				<p className='text-base text-gray-700 leading-relaxed ml-6'>{question.text}</p>
			)}
		</div>
	)
}
