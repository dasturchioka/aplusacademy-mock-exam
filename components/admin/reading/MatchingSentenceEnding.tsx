'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Trash, Trash2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface Pair {
	number: string | number
	item: string // sentence beginning
	match: string
	isInteractive: boolean
}

interface Option {
	label: string // A, B, C...
	text: string // sentence ending text
}

interface Props {
	data: {
		questionStart: string
		questionEnd: string
		type: string
		instructions: string[]
		headline?: string
		answerConstraints: string
		optionsAtATime?: string | number | null
		pairs: Pair[]
		options: Option[]
	}
	onChange: (updatedData: Props['data']) => void
}

export default function MatchingSentenceEndingsAdmin({ data, onChange }: Props) {
	const [form, setForm] = useState(data)
	const isSyncingRef = useRef(false)

	// Sync form with incoming data prop (for edit mode)
	useEffect(() => {
		isSyncingRef.current = true
		setForm(data)
		setTimeout(() => {
			isSyncingRef.current = false
		}, 0)
	}, [data])

	const updateField = <K extends keyof Props['data']>(key: K, value: Props['data'][K]) => {
		const updated = { ...form, [key]: value }
		setForm(updated)
		if (!isSyncingRef.current) {
			onChange(updated)
		}
	}

	const removeInstruction = (idx: number) => {
		const updated = [...form.instructions]
		updated.splice(idx, 1)
		updateField('instructions', updated)
	}

	const updatePair = (index: number, key: keyof Pair, value: string | boolean | number) => {
		const updatedPairs = [...form.pairs]
		updatedPairs[index] = { ...updatedPairs[index], [key]: value }
		updateField('pairs', updatedPairs)
	}

	const removePair = (index: number) => {
		const updated = [...form.pairs]
		updated.splice(index, 1)
		updateField('pairs', updated)
	}

	const addPair = () => {
		updateField('pairs', [...form.pairs, { number: '', item: '', match: '', isInteractive: true }])
	}

	const updateOption = (index: number, key: keyof Option, value: string) => {
		const updatedOptions = [...form.options]
		updatedOptions[index] = { ...updatedOptions[index], [key]: value }
		updateField('options', updatedOptions)
	}

	const removeOption = (index: number) => {
		const updated = [...form.options]
		updated.splice(index, 1)
		updateField('options', updated)
	}

	const addOption = () => {
		const label = String.fromCharCode(65 + form.options.length)
		updateField('options', [...form.options, { label, text: '' }])
	}

	return (
		<Card className='space-y-4 p-4'>
			<CardContent className='space-y-4'>
				<div className='grid grid-cols-2 gap-4'>
					<div>
						<Label>Question Start</Label>
						<Input
							value={form.questionStart}
							onChange={e => updateField('questionStart', e.target.value)}
						/>
					</div>
					<div>
						<Label>Question End</Label>
						<Input
							value={form.questionEnd}
							onChange={e => updateField('questionEnd', e.target.value)}
						/>
					</div>
				</div>

				<div>
					<Label>Headline</Label>
					<Input
						value={form.headline || ''}
						onChange={e => updateField('headline', e.target.value)}
						placeholder='Question block headline'
					/>
				</div>

				<div>
					<Label>Instructions</Label>
					{form.instructions.map((text, idx) => (
						<div key={idx} className='relative'>
							<Input
								className='mb-2'
								value={text}
								onChange={e => {
									const updated = [...form.instructions]
									updated[idx] = e.target.value
									updateField('instructions', updated)
								}}
							/>
							<Button
								className='absolute top-0 right-0'
								onClick={() => removeInstruction(idx)}
								variant='ghost'
							>
								<Trash />
							</Button>
						</div>
					))}
					<Button
						size='sm'
						className='mt-1'
						onClick={() => updateField('instructions', [...form.instructions, ''])}
					>
						Add Instruction
					</Button>
				</div>

				{/* <div>
					<Label>Answer Constraints</Label>
					<Textarea
						value={form.answerConstraints}
						onChange={e => updateField('answerConstraints', e.target.value)}
					/>
				</div> */} 

				<div>
					<Label>Options At A Time</Label>
					<Input
						value={form.optionsAtATime || ''}
						placeholder='Default: 1'
						onChange={e => updateField('optionsAtATime', e.target.value)}
					/>
				</div>

				<div className='space-y-2'>
					<Label>Sentence Beginnings (Pairs)</Label>
					{form.pairs.map((pair, idx) => (
						<div key={idx} className='flex gap-2 items-center'>
							<Input
								placeholder='Number'
								value={pair.number}
								onChange={e => updatePair(idx, 'number', e.target.value)}
								className='w-[80px]'
							/>
							<Input
								placeholder='Sentence beginning'
								value={pair.item}
								onChange={e => updatePair(idx, 'item', e.target.value)}
								className='flex-1'
							/>
							<Input
								placeholder='Match (correct option label)'
								value={pair.match}
								onChange={e => updatePair(idx, 'match', e.target.value)}
								className='w-[140px]'
							/>
							<Button size='icon' variant='ghost' onClick={() => removePair(idx)}>
								<Trash2 className='w-4 h-4 text-red-500' />
							</Button>
						</div>
					))}
					<Button variant='outline' onClick={addPair}>
						Add Pair
					</Button>
				</div>

				<div className='space-y-2'>
					<Label>Sentence Endings (Options)</Label>
					{form.options.map((opt, idx) => (
						<div key={idx} className='grid grid-cols-[60px_1fr_40px] gap-2 items-center'>
							<Input
								value={opt.label}
								placeholder='Label'
								onChange={e => updateOption(idx, 'label', e.target.value)}
							/>
							<Input
								value={opt.text}
								placeholder='Text'
								onChange={e => updateOption(idx, 'text', e.target.value)}
							/>
							<Button size='icon' variant='ghost' onClick={() => removeOption(idx)}>
								<Trash2 className='w-4 h-4 text-red-500' />
							</Button>
						</div>
					))}
					<Button variant='outline' onClick={addOption}>
						Add Option
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
