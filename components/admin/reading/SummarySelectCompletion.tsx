'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

type Block = {
	questionId: string
	type: 'summary-select-completion'
	questionStart: number
	questionEnd: number
	instructions: string[]
	headline?: string
	text: string
	options: string[] // A-J choices
	answers: { number: number; correctAnswer: string }[]
}

type Props = {
	questionBlock: Block
	onChange: (updated: Block) => void
}

export default function SummarySelectCompletionAdmin({ questionBlock, onChange }: Props) {
	const [block, setBlock] = useState<Block>(questionBlock)
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

	const handleTextChange = (value: string) => {
		const parts = value.split('____')
		const updatedAnswers = parts.slice(1).map((_, i) => ({
			number: block.questionStart + i,
			correctAnswer: block.answers[i]?.correctAnswer || '',
		}))

		setBlock({
			...block,
			text: value,
			answers: updatedAnswers,
		})
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
							value={block.questionStart}
							onChange={e => setBlock({ ...block, questionStart: Number(e.target.value) })}
						/>
						<Input
							type='number'
							value={block.questionEnd}
							onChange={e => setBlock({ ...block, questionEnd: Number(e.target.value) })}
						/>
					</div>
				</div>

				<div className='space-y-2'>
					<Label>Instructions</Label>
					{block.instructions.map((inst, i) => (
						<div key={i} className='flex gap-2'>
							<Input
								value={inst}
								onChange={e => {
									const updated = [...block.instructions]
									updated[i] = e.target.value
									setBlock({ ...block, instructions: updated })
								}}
							/>
							<Button
								type='button'
								variant='ghost'
								onClick={() =>
									setBlock({
										...block,
										instructions: block.instructions.filter((_, idx) => idx !== i),
									})
								}
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
					<Label>Text with “____” for dropdowns</Label>
					<Textarea value={block.text} onChange={e => handleTextChange(e.target.value)} />
				</div>

				<div className='space-y-2'>
					<Label>Options (A–J)</Label>
					{block.options.map((opt, i) => (
						<div key={i} className='flex gap-2 items-center'>
							<span className='w-6'>{String.fromCharCode(65 + i)}.</span>
							<Input
								value={opt}
								onChange={e => {
									const updated = [...block.options]
									updated[i] = e.target.value
									setBlock({ ...block, options: updated })
								}}
							/>
							<Button
								type='button'
								variant='ghost'
								onClick={() =>
									setBlock({
										...block,
										options: block.options.filter((_, idx) => idx !== i),
									})
								}
							>
								<Trash2 size={16} />
							</Button>
						</div>
					))}
					<Button
						type='button'
						size='sm'
						onClick={() => setBlock({ ...block, options: [...block.options, ''] })}
					>
						+ Add Option
					</Button>
				</div>

				<div className='space-y-2'>
					<Label>Correct Answers</Label>
					{block.answers.map((a, i) => (
						<div key={i} className='flex gap-2 items-center'>
							<Input className='w-[100px]' value={String(a.number)} onChange={(e) => {
								const updated = [...block.answers]
								updated[i].number = +e.target.value
								setBlock({ ...block, answers: updated })
							}} />
							<Input
								value={a.correctAnswer}
								onChange={e => {
									const updated = [...block.answers]
									updated[i].correctAnswer = e.target.value
									setBlock({ ...block, answers: updated })
								}}
							/>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
