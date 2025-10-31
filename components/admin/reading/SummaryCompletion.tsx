'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

export type SummaryCompletionQuestionBlock = {
	id: string
	questionId: string
	type: 'summary-completion'
	questionStart: number | string
	questionEnd: number | string
	instructions: string[]
	headline?: string
	answerConstraints?: string
	isInteractive: boolean
	text: string // contains sentence with ____ placeholders
	answers: { number: number; correctAnswer: string }[]
	questions: any[] // Should be empty for this type
}

type Props = {
	questionBlock: SummaryCompletionQuestionBlock
	onChange: (updated: SummaryCompletionQuestionBlock) => void
}

export default function SummaryCompletionAdmin({ questionBlock, onChange }: Props) {
	const [block, setBlock] = useState(questionBlock)
	const isSyncingRef = useRef(false)

	// Sync block with incoming questionBlock prop (for edit mode)
	useEffect(() => {
		isSyncingRef.current = true
		setBlock(questionBlock)
		setTimeout(() => {
			isSyncingRef.current = false
		}, 0)
	}, [questionBlock])

	useEffect(() => {
		if (!isSyncingRef.current) {
			onChange(block)
		}
	}, [block])

	// 🚀 REAL-TIME COMPONENT LOGGING (Separate useEffect to prevent infinite loops)
	useEffect(() => {
		const timeout = setTimeout(() => {
			console.log('📋 SummaryCompletion Component Updated:', {
				type: block.type,
				questionRange: `${block.questionStart}-${block.questionEnd}`,
				answersCount: block.answers.length,
				textLength: block.text.length,
				blanksCount: (block.text.match(/____/g) || []).length,
				fullStructure: block
			})
		}, 0)
		
		return () => clearTimeout(timeout)
	}, [block])

	const handleTextChange = (value: string) => {
		const parts = value.split('____')
		const startNum = typeof block.questionStart === 'string' ? parseInt(block.questionStart) : block.questionStart
		const updatedAnswers = parts.slice(1).map((_, i) => ({
			number: startNum + i,
			correctAnswer: block.answers[i]?.correctAnswer || '',
		}))

		setBlock({
			...block,
			text: value,
			answers: updatedAnswers,
		})
	}

	const handleAnswerChange = (i: number, value: string) => {
		const updated = [...block.answers]
		updated[i].correctAnswer = value
		setBlock({ ...block, answers: updated })
	}

	return (
		<Card className='mb-4'>
			<CardContent className='space-y-4 p-4'>
				<div className='space-y-2'>
					<Label>Question ID</Label>
					<Input
						value={block.questionId}
						onChange={e => setBlock({ ...block, questionId: e.target.value })}
					/>
				</div>

				<div className='space-y-2'>
					<Label>Headline</Label>
					<Input
						value={block.headline || ''}
						onChange={e => setBlock({ ...block, headline: e.target.value })}
						placeholder='Question block headline'
					/>
				</div>

				<div className='space-y-2'>
					<Label>Question Range</Label>
					<div className='flex gap-2'>
						<Input
							type='number'
							value={typeof block.questionStart === 'string' ? parseInt(block.questionStart) : block.questionStart}
							onChange={e =>
								setBlock({
									...block,
									questionStart: Number(e.target.value),
								})
							}
						/>
						<Input
							type='number'
							value={typeof block.questionEnd === 'string' ? parseInt(block.questionEnd) : block.questionEnd}
							onChange={e =>
								setBlock({
									...block,
									questionEnd: Number(e.target.value),
								})
							}
						/>
					</div>
				</div>

				<div className='space-y-2'>
					<Label>Answer Constraints</Label>
					<Input
						value={block.answerConstraints || ''}
						onChange={e => setBlock({ ...block, answerConstraints: e.target.value })}
						placeholder="e.g., NO MORE THAN TWO WORDS"
					/>
				</div>

				<div className='space-y-2'>
					<Label>Instructions</Label>
					{block.instructions.map((inst, i) => (
						<div key={i} className='flex gap-2'>
							<Input
								value={inst}
								onChange={e => {
									const newInstructions = [...block.instructions]
									newInstructions[i] = e.target.value
									setBlock({ ...block, instructions: newInstructions })
								}}
							/>
							<Button
								type='button'
								variant='ghost'
								onClick={() => {
									const updated = block.instructions.filter((_, idx) => idx !== i)
									setBlock({ ...block, instructions: updated })
								}}
							>
								<Trash2 size={16} />
							</Button>
						</div>
					))}
					<Button
						type='button'
						size='sm'
						onClick={() => setBlock({ ...block, instructions: [...block.instructions, ''] })}
					>
						+ Add Instruction
					</Button>
				</div>

				<div className='space-y-2'>
					<Label>Text with “____” for blanks</Label>
					<Textarea value={block.text} onChange={e => handleTextChange(e.target.value)} />
				</div>

				<div className='space-y-2'>
					<Label>Correct Answers</Label>
					{block.answers.map((a, i) => (
						<div key={i} className='flex gap-2 items-center'>
							<span className='w-6'>{a.number}.</span>
							<Input
								value={a.correctAnswer}
								onChange={e => handleAnswerChange(i, e.target.value)}
							/>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
