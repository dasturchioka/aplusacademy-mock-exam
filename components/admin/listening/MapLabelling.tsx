'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label as UILabel } from '@/components/ui/label'
import { ImageIcon, Plus, Trash2, X } from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface MapLabellingQuestionBlock {
	questionStart: string
	questionEnd: string
	type: 'map-labelling'
	instructions: string[]
	headline?: string
	image: {
		headline: string
		url: string
	}
	questions: {
		number: string
		text: string
		questionId: string
		questionNumber: number
	}[]
	labels: string[]
}

interface MapLabellingAdminProps {
	questionBlock: MapLabellingQuestionBlock
	onChange: (updated: MapLabellingQuestionBlock) => void
}

export const MapLabellingAdmin: React.FC<MapLabellingAdminProps> = ({
	questionBlock,
	onChange,
}) => {
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

	// 🚀 Auto-renumber questions when questionStart changes
	useEffect(() => {
		const startNum = parseInt(block.questionStart) || 1
		
		const needsRenumbering = block.questions.some((q, idx) => {
			const expectedNumber = (startNum + idx).toString()
			return q.questionNumber?.toString() !== expectedNumber
		})

		if (needsRenumbering) {
			const renumberedQuestions = block.questions.map((q, idx) => {
				const newNumber = startNum + idx
				return {
					...q,
					number: newNumber.toString(),
					questionNumber: newNumber
				}
			})
			
			console.log('🔢 Auto-renumbering MapLabelling questions:', {
				questionStart: startNum,
				totalQuestions: renumberedQuestions.length,
				newNumbers: renumberedQuestions.map(q => q.questionNumber)
			})
			
			setBlock(prev => ({ ...prev, questions: renumberedQuestions }))
		}
	}, [block.questionStart])

	// 🚀 Auto-update questionEnd based on questions
	useEffect(() => {
		if (block.questions.length > 0) {
			const startNum = parseInt(block.questionStart) || 1
			const expectedEnd = (startNum + block.questions.length - 1).toString()
			
			if (block.questionEnd !== expectedEnd) {
				console.log('🔢 Auto-updating questionEnd:', {
					oldEnd: block.questionEnd,
					newEnd: expectedEnd,
					totalQuestions: block.questions.length
				})
				
				setBlock(prev => ({ ...prev, questionEnd: expectedEnd }))
			}
		}
	}, [block.questions.length, block.questionStart])

	// Sync with parent
	useEffect(() => {
		if (!isSyncingRef.current) {
			onChange(block)
		}
	}, [block])

	const update = (updated: Partial<MapLabellingQuestionBlock>) => {
		const newBlock = { ...block, ...updated }
		setBlock(newBlock)
	}

	const updateQuestion = (index: number, field: 'number' | 'text', value: string) => {
		const newQuestions = [...block.questions]
		newQuestions[index][field] = value
		update({ questions: newQuestions })
	}

	const deleteQuestion = (index: number) => {
		const newQuestions = [...block.questions]
		newQuestions.splice(index, 1)
		update({ questions: newQuestions })
	}

	const addQuestion = () => {
		// Get the starting question number
		const startNum = parseInt(block.questionStart) || 1
		
		// Calculate question number based on questionStart + question count
		const nextQuestionNumber = startNum + block.questions.length
		
		const newQuestion = {
			number: nextQuestionNumber.toString(),
			text: 'New Question ____',
			questionId: `${uuidv4()}-${Date.now()}`,
			questionNumber: nextQuestionNumber,
		}
		
		console.log('➕ Adding new question to MapLabelling:', {
			questionStart: startNum,
			currentQuestionCount: block.questions.length,
			newQuestionNumber: nextQuestionNumber,
			newQuestion
		})
		
		update({ questions: [...block.questions, newQuestion] })
	}

	const addLabel = () => {
		const nextLabel = String.fromCharCode(65 + block.labels.length)
		update({ labels: [...block.labels, nextLabel] })
	}

	const updateLabel = (index: number, value: string) => {
		const newLabels = [...block.labels]
		newLabels[index] = value
		update({ labels: newLabels })
	}

	const removeLabel = (label: string) => {
		update({ labels: block.labels.filter(l => l !== label) })
	}

	const addInstruction = () => {
		update({ instructions: [...block.instructions, ''] })
	}

	const updateInstruction = (index: number, value: string) => {
		const newInstructions = [...block.instructions]
		newInstructions[index] = value
		update({ instructions: newInstructions })
	}

	const deleteInstruction = (index: number) => {
		const newInstructions = [...block.instructions]
		newInstructions.splice(index, 1)
		update({ instructions: newInstructions })
	}

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onloadend = () => {
				update({ image: { ...block.image, url: reader.result as string } })
			}
			reader.readAsDataURL(file)
		}
	}

	return (
		<Card className='p-4 space-y-4'>
			<CardHeader>
				<CardTitle>Map Labelling Admin</CardTitle>
			</CardHeader>

		<CardContent className='space-y-4'>
			<div>
				<UILabel>Headline</UILabel>
				<Input
					value={block.headline || ''}
					onChange={e => update({ headline: e.target.value })}
					placeholder='Question block headline'
				/>
			</div>

			<div className='space-y-2'>
				<UILabel className='font-semibold'>Instructions</UILabel>
				{block.instructions.map((instruction, index) => (
					<div key={index} className='flex gap-2 items-center'>
						<Input
							value={instruction}
							onChange={e => updateInstruction(index, e.target.value)}
							placeholder='Enter instruction'
							className='flex-1'
						/>
						<Button
							size='icon'
							variant='ghost'
							onClick={() => deleteInstruction(index)}
							className='text-red-500'
						>
							<Trash2 size={16} />
						</Button>
					</div>
				))}
				<Button size='sm' variant='outline' onClick={addInstruction}>
					<Plus className='mr-2' size={16} />
					Add Instruction
				</Button>
			</div>

			<div>
				<UILabel>
					<ImageIcon className='inline mr-2' size={16} />
					Image URL:
				</UILabel>
				<Input
					value={block.image.url}
					onChange={e => update({ image: { ...block.image, url: e.target.value } })}
				/>
			</div>

				<div>
					<UILabel>Or Upload Image:</UILabel>
					<Input type='file' accept='image/*' onChange={handleImageUpload} />
				</div>

				<Button variant='destructive' onClick={() => update({ image: { headline: '', url: '' } })}>
					<Trash2 className='mr-2' size={16} /> Remove Image
				</Button>

			{/* Question Start and End */}
			<div className='grid grid-cols-2 gap-4'>
				<div>
					<UILabel>Question Start</UILabel>
					<Input
						type='number'
						value={block.questionStart}
						onChange={e => update({ questionStart: e.target.value })}
						placeholder='e.g., 1'
					/>
				</div>
				<div>
					<UILabel>Question End</UILabel>
					<Input
						type='number'
						value={block.questionEnd}
						onChange={e => update({ questionEnd: e.target.value })}
						placeholder='e.g., 10'
					/>
				</div>
			</div>

			<div>
				<h3 className='font-semibold mb-2'>Questions</h3>
				{block.questions.map((q, index) => (
					<div key={q.questionId} className='flex gap-2 items-center mb-2'>
						<Input
							value={q.number}
							onChange={e => updateQuestion(index, 'number', e.target.value)}
							className='w-16'
							placeholder='#'
						/>
						<Input
							value={q.text}
							onChange={e => updateQuestion(index, 'text', e.target.value)}
							className='flex-1'
							placeholder='Question text with ____'
						/>
						<Button variant='destructive' onClick={() => deleteQuestion(index)} size='icon'>
							<X size={16} />
						</Button>
					</div>
				))}
				<Button onClick={addQuestion}>
					<Plus className='mr-2' size={16} />
					Add Question
				</Button>
			</div>

				<div>
					<h3 className='font-semibold mb-2'>Labels</h3>
					<div className='flex gap-2 flex-wrap'>
						{block.labels.map((label, index) => (
							<div key={label} className='flex items-center gap-2'>
								<Input
									value={label}
									onChange={e => updateLabel(index, e.target.value)}
									className='w-12 text-center'
								/>
								<Button
									variant='ghost'
									size='icon'
									className='text-red-500'
									onClick={() => removeLabel(label)}
								>
									<X size={14} />
								</Button>
							</div>
						))}
					</div>
					<Button variant='outline' className='mt-2' onClick={addLabel}>
						<Plus className='mr-2' size={16} /> Add Label
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
