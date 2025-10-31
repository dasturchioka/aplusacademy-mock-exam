import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface QuestionIndicatorProps {
	currentPart: number
	totalQuestions: number
	answeredQuestions: number
	parts: any[]
	answers: Record<string, any>
}

export function QuestionIndicator({
	currentPart,
	totalQuestions,
	answeredQuestions,
	parts,
	answers,
}: QuestionIndicatorProps) {
	const getPartProgress = (part: any) => {
		const partQuestions = part.questions?.filter((q: any) => q.isInteractive) || []
		const partAnswered = partQuestions.filter((q: any) => answers[q.questionId]).length
		return { total: partQuestions.length, answered: partAnswered }
	}

	return (
		<div className='space-y-4'>
			<div className='text-center'>
				<div className='text-2xl font-bold text-blue-600'>
					{answeredQuestions}/{totalQuestions}
				</div>
				<div className='text-sm text-gray-600'>Questions Answered</div>
			</div>

			<div className='space-y-2'>
				{parts.map(part => {
					const progress = getPartProgress(part)
					const isCurrentPart = part.part === currentPart

					return (
						<Card key={part.part} className={`p-3 ${isCurrentPart ? 'ring-2 ring-blue-500' : ''}`}>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<div
										className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
											isCurrentPart ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
										}`}
									>
										{part.part}
									</div>
									<span className='text-sm font-medium'>Passage {part.part}</span>
								</div>

								<Badge variant={progress.answered === progress.total ? 'default' : 'outline'}>
									{progress.answered}/{progress.total}
								</Badge>
							</div>

							{/* Progress bar */}
							<div className='mt-2 w-full bg-gray-200 rounded-full h-2'>
								<div
									className={`h-2 rounded-full transition-all duration-300 ${
										progress.answered === progress.total ? 'bg-green-500' : 'bg-blue-500'
									}`}
									style={{ width: `${(progress.answered / progress.total) * 100}%` }}
								/>
							</div>
						</Card>
					)
				})}
			</div>

			{/* Overall progress */}
			<div className='pt-4 border-t'>
				<div className='flex justify-between items-center mb-2'>
					<span className='text-sm text-gray-600'>Overall Progress</span>
					<span className='text-sm font-medium'>
						{Math.round((answeredQuestions / totalQuestions) * 100)}%
					</span>
				</div>
				<div className='w-full bg-gray-200 rounded-full h-3'>
					<div
						className='h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300'
						style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
					/>
				</div>
			</div>
		</div>
	)
}
