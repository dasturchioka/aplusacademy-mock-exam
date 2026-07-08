'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

type Question = {
	isInteractive: boolean
	number?: string
	text: string
	questionId?: string
	questionNumber?: number
}

type DiagramLabellingAdminProps = {
	question: {
		questionStart?: string
		questionEnd?: string
		type?: 'diagram-labelling'
		instructions?: string[]
		headline?: string
		image?: {
			headline?: string
			url?: string
		}
		questions?: Question[]
	}
	onChange: (updated: any) => void
}

export default function DiagramLabellingAdmin({
	question,
	onChange,
}: DiagramLabellingAdminProps) {
	const [block, setBlock] = useState(question)
	const isSyncingRef = useRef(false)

	// Sync block with incoming question prop (for edit mode)
	useEffect(() => {
		isSyncingRef.current = true
		setBlock(question)
		setTimeout(() => {
			isSyncingRef.current = false
		}, 0)
	}, [question])

	// Sync with parent whenever block changes (except during syncing)
	useEffect(() => {
		if (!isSyncingRef.current) {
			console.log('📤 Calling onChange with block:', { 
				questionStart: block.questionStart, 
				questionEnd: block.questionEnd,
				type: block.type,
				questionsCount: block.questions?.length
			})
			onChange(block)
		} else {
			console.log('⏸️ Skipping onChange (syncing)')
		}
	}, [block])

	const update = (updated: Partial<typeof block>) => {
		console.log('🎯 DiagramLabelling updating:', updated)
		setBlock(prev => {
			const newBlock = { ...prev, ...updated }
			console.log('📦 New block state:', { 
				questionStart: newBlock.questionStart, 
				questionEnd: newBlock.questionEnd,
				type: newBlock.type
			})
			return newBlock
		})
	}

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onloadend = () => {
				update({ image: { ...block.image, url: reader.result as string } })
			}
			reader.readAsDataURL(file)
		}
	}

	const updateQuestion = (index: number, key: keyof Question, value: any) => {
		const newQuestions = [...(block.questions || [])]
		newQuestions[index] = { ...newQuestions[index], [key]: value }
		update({ questions: newQuestions })
	}

	const addQuestion = () => {
		// Calculate the next question number based on interactive questions
		const interactiveQuestions = (block.questions || []).filter(q => q.isInteractive)
		const lastQuestionNumber = interactiveQuestions.length > 0
			? Math.max(...interactiveQuestions.map(q => q.questionNumber || 0))
			: (typeof block.questionStart === 'string' ? parseInt(block.questionStart) : block.questionStart) || 0
		
		const newQuestion: Question = {
			isInteractive: true,
			number: (lastQuestionNumber + 1).toString(),
			text: '',
			questionId: `${uuidv4()}-${Date.now()}`,
			questionNumber: lastQuestionNumber + 1,
		}
		
		update({ questions: [...(block.questions || []), newQuestion] })
	}

	const removeQuestion = (index: number) => {
		const newQuestions = [...(block.questions || [])]
		newQuestions.splice(index, 1)
		update({ questions: newQuestions })
	}

	const updateInstruction = (index: number, value: string) => {
		const newInstructions = [...(block.instructions || [])]
		newInstructions[index] = value
		update({ instructions: newInstructions })
	}

	const addInstruction = () => {
		update({ instructions: [...(block.instructions || []), ''] })
	}

	const deleteInstruction = (index: number) => {
		const newInstructions = [...(block.instructions || [])]
		newInstructions.splice(index, 1)
		update({ instructions: newInstructions })
	}

	return (
		<div className='space-y-4'>
			<div>
				<Label>Headline</Label>
				<Input 
					value={block.headline || ''} 
					onChange={e => update({ headline: e.target.value })} 
					placeholder='Question block headline' 
				/>
			</div>

			<div>
				<Label>Image Headline</Label>
				<Input 
					value={block.image?.headline || ''} 
					onChange={e => update({ image: { ...(block.image || { url: '' }), headline: e.target.value } })} 
				/>
			</div>

			<div className='space-y-2'>
				<Label>Upload Image</Label>
				<Input type='file' accept='image/*' onChange={handleFileUpload} />
				<Label>Or paste image URL</Label>
				<Input 
					value={block.image?.url || ''} 
					onChange={e => update({ image: { ...(block.image || { headline: '' }), url: e.target.value } })} 
				/>
			</div>

			{block.image?.url && (
				<div>
					<img src={block.image.url} alt='Diagram Preview' className='max-w-full border mt-2 rounded' />
				</div>
			)}

			{/* Question Range */}
			<div className='grid grid-cols-2 gap-4'>
				<div>
					<Label>Question Start</Label>
					<Input 
						value={block.questionStart || ''} 
						onChange={e => update({ questionStart: e.target.value })} 
					/>
				</div>
				<div>
					<Label>Question End</Label>
					<Input 
						value={block.questionEnd || ''} 
						onChange={e => update({ questionEnd: e.target.value })} 
					/>
				</div>
			</div>

			{/* Instructions */}
			<div className='space-y-2'>
				<Label>Instructions</Label>
				{(block.instructions || []).map((text, i) => (
					<div key={i} className='flex gap-2 items-center'>
						<Textarea
							value={text}
							onChange={e => updateInstruction(i, e.target.value)}
							className='flex-1'
						/>
						<Button
							size='icon'
							variant='ghost'
							onClick={() => deleteInstruction(i)}
							className='text-red-500'
						>
							✕
						</Button>
					</div>
				))}
				<Button size='sm' variant='outline' onClick={addInstruction}>
					+ Add Instruction
				</Button>
			</div>

			<hr />

			<div className='space-y-4'>
				<h3 className='text-lg font-semibold'>Questions</h3>
				{(block.questions || []).map((q, index) => (
					<div key={q.questionId || index} className='border rounded p-4 space-y-2'>
						<div className='flex items-center justify-between'>
							<Label>Is Interactive</Label>
							<Switch
								checked={q.isInteractive}
								onCheckedChange={checked => updateQuestion(index, 'isInteractive', checked)}
							/>
						</div>

						{q.isInteractive && (
							<div>
								<Label>Question Number</Label>
								<Input
									value={q.number || ''}
									onChange={e => updateQuestion(index, 'number', e.target.value)}
								/>
							</div>
						)}

						{q.questionId && (
							<div>
								<Label>Question ID (Auto-generated)</Label>
								<Input value={q.questionId} disabled className='bg-gray-100' />
							</div>
						)}

						{q.isInteractive && (
							<div>
								<Label>Question Number (Internal)</Label>
								<Input 
									type='number'
									value={q.questionNumber} 
									onChange={e => updateQuestion(index, 'questionNumber', parseInt(e.target.value) || undefined)}
								/>
							</div>
						)}

						<div>
							<Label>Text</Label>
							<Textarea
								value={q.text}
								onChange={e => updateQuestion(index, 'text', e.target.value)}
							/>
						</div>

						<Button variant='destructive' onClick={() => removeQuestion(index)}>
							Delete
						</Button>
					</div>
				))}

				<Button onClick={addQuestion}>Add Question</Button>
			</div>
		</div>
	)
}