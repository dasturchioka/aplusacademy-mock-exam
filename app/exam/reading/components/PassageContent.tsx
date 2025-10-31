import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ReadingQuestionRenderer } from './ReadingQuestionRenderer'

interface PassageContentProps {
	partData: any
	answers: Record<string, any>
	updateAnswer: (questionId: string, value: string | string[], type: string) => void
}

export function PassageContent({ partData, answers, updateAnswer }: PassageContentProps) {
	if (!partData) return null

	return (
		<div className='space-y-6'>
			{/* Passage Header */}
			<div className='border-b pb-4'>
				<div className='flex items-center justify-between mb-2'>
					<h2 className='text-xl font-bold'>Passage {partData.part}</h2>
					<Badge variant='outline'>{partData.questionsRange}</Badge>
				</div>
				{partData.title && (
					<h3 className='text-lg font-semibold text-gray-700 mb-2'>{partData.title}</h3>
				)}
			</div>

			{/* Two-column layout for passage and questions */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* Reading Passage */}
				<div className='space-y-4'>
					<div className='bg-gray-50 p-4 rounded-lg'>
						<h4 className='font-semibold mb-3'>Reading Passage</h4>
						<ScrollArea className='h-[600px]'>
							<div className='prose prose-sm max-w-none'>
								{partData.passage ? (
									<div className='whitespace-pre-wrap text-justify leading-relaxed'>
										{partData.passage}
									</div>
								) : (
									<p className='text-gray-500 italic'>Passage content will be displayed here...</p>
								)}
							</div>
						</ScrollArea>
					</div>
				</div>

				{/* Questions */}
				<div className='space-y-4'>
					<div className='bg-white'>
						<h4 className='font-semibold mb-3'>Questions {partData.questionsRange}</h4>
						<ScrollArea className='h-[600px]'>
							<div className='space-y-4'>
								{partData.questions?.map((question: any, index: number) => (
									<div key={question.questionId || index} className='border-b pb-4 last:border-b-0'>
										<ReadingQuestionRenderer
											question={question}
											answer={answers[question.questionId]}
											onAnswerChange={(value, type) =>
												updateAnswer(question.questionId, value, type)
											}
										/>
									</div>
								))}
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>
		</div>
	)
}
