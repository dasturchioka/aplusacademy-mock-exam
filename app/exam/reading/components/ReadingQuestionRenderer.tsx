import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'

interface ReadingQuestionRendererProps {
	question: any
	answer: any
	onAnswerChange: (value: string | string[], type: string) => void
}

export function ReadingQuestionRenderer({
	question,
	answer,
	onAnswerChange,
}: ReadingQuestionRendererProps) {
	if (!question) return null

	const renderQuestion = () => {
		switch (question.type) {
			case 'multiple-choice':
				return (
					<div className='space-y-3'>
						<div className='flex items-start gap-3'>
							<Badge variant='outline' className='mt-1'>
								{question.number}
							</Badge>
							<div className='flex-1'>
								<Label className='text-sm font-medium leading-relaxed'>
									{question.questionText}
								</Label>
								<div className='mt-3'>
									<RadioGroup
										value={answer?.value || ''}
										onValueChange={value => onAnswerChange(value, question.type)}
									>
										{question.textList?.map((option: any) => (
											<div key={option.variant} className='flex items-center space-x-2'>
												<RadioGroupItem
													value={option.variant}
													id={`${question.questionId}-${option.variant}`}
												/>
												<Label
													htmlFor={`${question.questionId}-${option.variant}`}
													className='text-sm cursor-pointer'
												>
													<span className='font-medium'>{option.variant}</span> {option.text}
												</Label>
											</div>
										))}
									</RadioGroup>
								</div>
							</div>
						</div>
					</div>
				)

			case 'multiple-select':
				return (
					<MultipleSelectQuestion
						question={question}
						answer={answer}
						onAnswerChange={onAnswerChange}
					/>
				)

			case 'true-false-not-given':
			case 'yes-no-not-given':
				return (
					<div className='space-y-3'>
						<div className='flex items-start gap-3'>
							<Badge variant='outline' className='mt-1'>
								{question.number}
							</Badge>
							<div className='flex-1'>
								<Label className='text-sm font-medium leading-relaxed'>{question.text}</Label>
								<div className='mt-3'>
									<RadioGroup
										value={answer?.value || ''}
										onValueChange={value => onAnswerChange(value, question.type)}
									>
										{question.textList?.map((option: any) => (
											<div key={option.variant} className='flex items-center space-x-2'>
												<RadioGroupItem
													value={option.variant}
													id={`${question.questionId}-${option.variant}`}
												/>
												<Label
													htmlFor={`${question.questionId}-${option.variant}`}
													className='text-sm cursor-pointer font-medium'
												>
													{option.text}
												</Label>
											</div>
										))}
									</RadioGroup>
								</div>
							</div>
						</div>
					</div>
				)

			case 'matching-headings':
			case 'matching-information':
			case 'matching-sentence-endings':
				return (
					<div className='space-y-3'>
						<div className='flex items-start gap-3'>
							<Badge variant='outline' className='mt-1'>
								{question.number}
							</Badge>
							<div className='flex-1'>
								<Label className='text-sm font-medium leading-relaxed'>{question.text}</Label>
								<div className='mt-3'>
									<Input
										type='text'
										placeholder='Enter your answer...'
										value={answer?.value || ''}
										onChange={e => onAnswerChange(e.target.value, question.type)}
										className='max-w-md'
									/>
								</div>
							</div>
						</div>
					</div>
				)

			case 'sentence-completion':
			case 'summary-completion':
			case 'diagram-completion':
				return (
					<div className='space-y-3'>
						<div className='flex items-start gap-3'>
							<Badge variant='outline' className='mt-1'>
								{question.number}
							</Badge>
							<div className='flex-1'>
								<Label className='text-sm font-medium leading-relaxed'>{question.text}</Label>
								{question.answerConstraints && (
									<div className='mt-1 text-xs text-gray-600 font-medium'>
										{question.answerConstraints}
									</div>
								)}
								<div className='mt-3'>
									<Input
										type='text'
										placeholder='Enter your answer...'
										value={answer?.value || ''}
										onChange={e => onAnswerChange(e.target.value, question.type)}
										className='max-w-md'
									/>
								</div>
							</div>
						</div>
					</div>
				)

			case 'short-answer':
				return (
					<div className='space-y-3'>
						<div className='flex items-start gap-3'>
							<Badge variant='outline' className='mt-1'>
								{question.number}
							</Badge>
							<div className='flex-1'>
								<Label className='text-sm font-medium leading-relaxed'>{question.text}</Label>
								{question.answerConstraints && (
									<div className='mt-1 text-xs text-gray-600 font-medium'>
										{question.answerConstraints}
									</div>
								)}
								<div className='mt-3'>
									<Textarea
										placeholder='Enter your answer...'
										value={answer?.value || ''}
										onChange={e => onAnswerChange(e.target.value, question.type)}
										className='max-w-md resize-none'
										rows={2}
									/>
								</div>
							</div>
						</div>
					</div>
				)

			case 'divider':
				return (
					<Card className='p-4 bg-blue-50 border-blue-200'>
						<div className='space-y-2'>
							{question.topText && (
								<div className='font-bold text-blue-900'>{question.topText}</div>
							)}
							{question.topInstructions && (
								<div className='text-sm text-blue-800'>{question.topInstructions}</div>
							)}
							{question.instructions && (
								<div className='text-sm text-blue-700'>{question.instructions}</div>
							)}
							{question.draggableVariants && (
								<div className='mt-3 space-y-1'>
									{question.draggableVariants.map((variant: any) => (
										<div key={variant.variant} className='text-sm'>
											<span className='font-medium'>{variant.variant}</span> {variant.text}
										</div>
									))}
								</div>
							)}
						</div>
					</Card>
				)

			case 'image':
				return (
					<Card className='p-4'>
						<div className='text-center'>
							{question.headline && <h4 className='font-semibold mb-3'>{question.headline}</h4>}
							{question.base64 && (
								<img
									src={question.base64}
									alt={question.headline || 'Question Image'}
									className='max-w-full h-auto mx-auto rounded-lg'
								/>
							)}
						</div>
					</Card>
				)

			default:
				return (
					<div className='space-y-3'>
						<div className='flex items-start gap-3'>
							<Badge variant='outline' className='mt-1'>
								{question.number}
							</Badge>
							<div className='flex-1'>
								<Label className='text-sm font-medium leading-relaxed'>
									{question.text || question.questionText}
								</Label>
								<div className='mt-3'>
									<Input
										type='text'
										placeholder='Enter your answer...'
										value={answer?.value || ''}
										onChange={e => onAnswerChange(e.target.value, question.type)}
										className='max-w-md'
									/>
								</div>
							</div>
						</div>
					</div>
				)
		}
	}

	return <div className='py-2'>{renderQuestion()}</div>
}

function MultipleSelectQuestion({
	question,
	answer,
	onAnswerChange,
}: {
	question: any
	answer: any
	onAnswerChange: (value: string | string[], type: string) => void
}) {
	const [selected, setSelected] = useState<string[]>(answer?.value || [])

	const toggleChoice = (variant: string) => {
		let updated: string[]
		if (selected.includes(variant)) {
			updated = selected.filter(v => v !== variant)
		} else {
			updated = [...selected, variant]
		}
		setSelected(updated)
		onAnswerChange(updated, question.type)
	}

	return (
		<div className='space-y-3'>
			<div className='flex items-start gap-3'>
				<Badge variant='outline' className='mt-1'>
					{question.number}
				</Badge>
				<div className='flex-1'>
					<Label className='text-sm font-medium leading-relaxed'>{question.questionText}</Label>
					<div className='mt-3 space-y-2'>
						{question.choices?.map((choice: any, idx: number) => (
							<div
								key={idx}
								className={`flex items-center gap-2 p-2 rounded-md border ${
									selected.includes(choice.variant)
										? 'border-primary bg-primary/10'
										: 'border-muted'
								} transition`}
								onClick={() => toggleChoice(choice.variant)}
							>
								<Checkbox checked={selected.includes(choice.variant)} />
								<Label className='cursor-pointer'>
									<span className='font-semibold mr-1'>{choice.variant}.</span> {choice.text}
								</Label>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
