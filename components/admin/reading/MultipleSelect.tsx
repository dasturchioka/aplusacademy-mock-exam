'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

type Choice = {
	variant: string
	text: string
}

type Props = {
	data: {
		questionStart: string
		questionEnd: string
		questionText: string
		instructions?: string[]
		headline?: string
		choices?: Choice[]
		type: 'multiple-select'
	}
	onChange: (updatedData: Props['data']) => void
}

export default function MultipleSelectAdmin({ data, onChange }: Props) {
	const [form, setForm] = useState({
		...data,
		instructions: data.instructions || [''],
		choices: data.choices || []
	})
	const isSyncingRef = useRef(false)

	// Sync form with incoming data prop (for edit mode)
	useEffect(() => {
		isSyncingRef.current = true
		setForm({
			...data,
			instructions: data.instructions || [''],
			choices: data.choices || []
		})
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

	const updateChoice = (index: number, field: keyof Choice, value: string) => {
		const updatedChoices = [...(form.choices || [])]
		updatedChoices[index] = { ...updatedChoices[index], [field]: value }
		updateField('choices', updatedChoices)
	}

	const removeChoice = (index: number) => {
		const updatedChoices = [...(form.choices || [])]
		updatedChoices.splice(index, 1)
		updateField('choices', updatedChoices)
	}

	const addChoice = () => {
		const currentChoices = form.choices || []
		const nextLetter = String.fromCharCode(65 + currentChoices.length)
		updateField('choices', [...currentChoices, { variant: nextLetter, text: '' }])
	}

	const updateInstruction = (index: number, value: string) => {
		const updated = [...form.instructions]
		updated[index] = value
		updateField('instructions', updated)
	}

	const addInstruction = () => {
		updateField('instructions', [...form.instructions, ''])
	}

	const removeInstruction = (index: number) => {
		const updated = [...form.instructions]
		updated.splice(index, 1)
		updateField('instructions', updated)
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
					<Label>Question Text</Label>
					<Textarea
						value={form.questionText}
						onChange={e => updateField('questionText', e.target.value)}
					/>
				</div>

				<div className='space-y-2'>
					<Label>Instructions</Label>
					{form.instructions.map((inst, idx) => (
						<div key={idx} className='grid grid-cols-[1fr_40px] items-center gap-2'>
							<Textarea
								value={inst}
								placeholder='Enter instruction text...'
								onChange={e => updateInstruction(idx, e.target.value)}
								rows={2}
							/>
							<Button 
								size='icon' 
								variant='ghost' 
								onClick={() => removeInstruction(idx)}
								disabled={form.instructions.length === 1}
							>
								<Trash2 className='w-4 h-4 text-red-500' />
							</Button>
						</div>
					))}
					<Button onClick={addInstruction} variant='outline' size='sm'>
						+ Add Instruction
					</Button>
				</div>

				<div className='space-y-4'>
					<Label>Choices</Label>
					{form?.choices?.map((choice, idx) => (
						<div key={idx} className='grid grid-cols-[60px_1fr_40px] items-center gap-2'>
							<Input
								placeholder='Variant'
								value={choice.variant}
								onChange={e => updateChoice(idx, 'variant', e.target.value)}
							/>
							<Input
								placeholder='Text'
								value={choice.text}
								onChange={e => updateChoice(idx, 'text', e.target.value)}
							/>
							<Button size='icon' variant='ghost' onClick={() => removeChoice(idx)}>
								<Trash2 className='w-4 h-4 text-red-500' />
							</Button>
						</div>
					))}
					<Button onClick={addChoice} variant='outline'>
						Add Choice
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
