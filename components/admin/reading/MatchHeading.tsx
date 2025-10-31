'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { formatText } from '@/components/exam/listening/FormCompletion'

type Option = {
	variant: string
	text: string
}

type Question = {
	number: number
	paragraph: string
	answer: string
	questionId: string | number
}

// Updated to match reading-with-match-heading.json structure
type QuestionBlock = {
	id: string
	questionId?: string
	type: 'match-heading' | 'matching-headers'
	instructions: string[]
	headline?: string
	answerConstraints?: string
	isInteractive: boolean
	options: Option[]
	questions?: Question[]
	questionStart: number | string
	questionEnd: number | string
}

type Props = {
	data: QuestionBlock
	onChange: (updated: QuestionBlock) => void
}

export default function MatchHeadingAdmin({ data, onChange }: Props) {
	// Initialize questions array if it doesn't exist
	const [block, setBlock] = useState({
		...data,
		questions: data.questions || []
	})
	const isSyncingRef = useRef(false)

	// Sync block with incoming data prop (for edit mode)
	useEffect(() => {
		isSyncingRef.current = true
		setBlock({
			...data,
			questions: data.questions || []
		})
		setTimeout(() => {
			isSyncingRef.current = false
		}, 0)
	}, [data])

	// 🚀 Auto-renumber questions when questionStart changes
	useEffect(() => {
		const startNum = typeof block.questionStart === 'number' 
			? block.questionStart 
			: parseInt(block.questionStart as string) || 1
		
		const needsRenumbering = block.questions.some((q, idx) => {
			const expectedNumber = startNum + idx
			return q.number !== expectedNumber
		})

		if (needsRenumbering) {
			const renumberedQuestions = block.questions.map((q, idx) => {
				return {
					...q,
					number: startNum + idx
				}
			})
			
			console.log('🔢 Auto-renumbering MatchHeading questions:', {
				questionStart: startNum,
				totalQuestions: renumberedQuestions.length,
				newNumbers: renumberedQuestions.map(q => q.number)
			})
			
			setBlock(prev => ({ ...prev, questions: renumberedQuestions }))
		}
	}, [block.questionStart])

	// 🚀 Auto-update questionEnd based on questions
	useEffect(() => {
		if (block.questions.length > 0) {
			const startNum = typeof block.questionStart === 'number' 
				? block.questionStart 
				: parseInt(block.questionStart as string) || 1
			const expectedEnd = startNum + block.questions.length - 1
			
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

	useEffect(() => {
		if (!isSyncingRef.current) {
			onChange(block)
		}
	}, [block])

	// 🚀 REAL-TIME COMPONENT LOGGING (Separate useEffect to prevent infinite loops)
	useEffect(() => {
		const timeout = setTimeout(() => {
			console.log('🎭 MatchHeading Component Updated:', {
				type: block.type,
				questionRange: `${block.questionStart}-${block.questionEnd}`,
				questionsCount: block.questions.length,
				optionsCount: block.options.length,
				fullStructure: block
			})
		}, 0)
		
		return () => clearTimeout(timeout)
	}, [block])

	const updateBlock = (updated: Partial<QuestionBlock>) => {
		setBlock(prev => ({ ...prev, ...updated }))
	}

	const updateQuestions = (questions: Question[]) => updateBlock({ questions })
	const updateOptions = (options: Option[]) => updateBlock({ options })

	const handleQuestionChange = (index: number, field: keyof Question, value: string | number) => {
		const updated = [...block.questions]
		updated[index] = { ...updated[index], [field]: value }
		updateQuestions(updated)
	}

	const addQuestion = () => {
		// Get the starting question number
		const startNum = typeof block.questionStart === 'number' 
			? block.questionStart 
			: parseInt(block.questionStart as string) || 1
		
		// Calculate question number based on questionStart + question count
		const nextQuestionNumber = startNum + block.questions.length
		
		console.log('➕ Adding new question to MatchHeading:', {
			questionStart: startNum,
			currentQuestionCount: block.questions.length,
			newQuestionNumber: nextQuestionNumber
		})
		
		updateQuestions([
			...block.questions,
			{
				number: nextQuestionNumber,
				paragraph: '',
				answer: '',
				questionId: `${uuidv4()}-${Date.now()}`,
			},
		])
	}

	const removeQuestion = (index: number) => {
		const updated = [...block.questions]
		updated.splice(index, 1)
		updateQuestions(updated)
	}

	const handleOptionChange = (index: number, field: keyof Option, value: string) => {
		const updated = [...block.options]
		updated[index] = { ...updated[index], [field]: value }
		updateOptions(updated)
	}

	const addOption = () => {
		updateOptions([...block.options, { variant: '', text: '' }])
	}

	const removeOption = (index: number) => {
		const updated = [...block.options]
		updated.splice(index, 1)
		updateOptions(updated)
	}

	const handleInstructionChange = (index: number, value: string) => {
		const updated = [...block.instructions]
		updated[index] = value
		updateBlock({ instructions: updated })
	}

	const addInstruction = () => {
		updateBlock({ instructions: [...block.instructions, ''] })
	}

	const removeInstruction = (index: number) => {
		const updated = [...block.instructions]
		updated.splice(index, 1)
		updateBlock({ instructions: updated })
	}

	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<Label>Headline</Label>
				<Input
					value={block.headline || ''}
					onChange={e => updateBlock({ headline: e.target.value })}
					placeholder='Question block headline'
				/>
			</div>

			<div className='space-y-2'>
				<Label>Instructions</Label>
				{block.instructions.map((inst, i) => (
					<div key={i} className='flex gap-2'>
						<Textarea
							value={inst}
							onChange={e => handleInstructionChange(i, e.target.value)}
							className='flex-1'
						/>
						<Button variant='destructive' onClick={() => removeInstruction(i)}>
							<Trash2 className='w-4 h-4' />
						</Button>
					</div>
				))}
				<Button onClick={addInstruction}>+ Add Instruction</Button>
			</div>

			<div className='flex gap-4'>
				<div className='flex-1'>
					<Label>Question Start</Label>
					<Input
						type='number'
						value={block.questionStart}
						onChange={e => updateBlock({ questionStart: Number(e.target.value) })}
					/>
				</div>
				<div className='flex-1'>
					<Label>Question End</Label>
					<Input
						type='number'
						value={block.questionEnd}
						onChange={e => updateBlock({ questionEnd: Number(e.target.value) })}
					/>
				</div>
			</div>

			<div className='space-y-2'>
				<Label>Options</Label>
				{block.options.map((opt, i) => (
					<div key={i} className='flex gap-2'>
						<Input
							placeholder='Variant (e.g. i)'
							value={opt.variant}
							onChange={e => handleOptionChange(i, 'variant', e.target.value)}
						/>
						<Textarea
							placeholder='Option Text'
							value={opt.text}
							onChange={e => handleOptionChange(i, 'text', e.target.value)}
						/>
						<Button variant='destructive' size='sm' onClick={() => removeOption(i)}>
							<Trash2 className='w-4 h-4 mr-1' /> Remove Option
						</Button>
					</div>
				))}
				<Button onClick={addOption}>+ Add Option</Button>
			</div>

			{/* <div className='space-y-2'>
				<Label>Questions</Label>
				{block.questions.map((q, i) => (
					<div key={i} className='flex gap-2'>
						<Input
							type='number'
							value={q.number}
							onChange={e => handleQuestionChange(i, 'number', Number(e.target.value))}
							placeholder='Question Number'
						/>
						<Textarea
							value={q.paragraph}
							onChange={e => handleQuestionChange(i, 'paragraph', e.target.value)}
							placeholder='Paragraph Text'
						/>
						<Input
							value={q.answer}
							onChange={e => handleQuestionChange(i, 'answer', e.target.value)}
							placeholder='Correct Answer (e.g. i)'
						/>
						<Button variant='destructive' size='sm' onClick={() => removeQuestion(i)}>
							<Trash2 className='w-4 h-4 mr-1' /> Remove Question
						</Button>
					</div>
				))}
				<Button onClick={addQuestion}>+ Add Question</Button>
			</div> */}
		</div>
	)
}
