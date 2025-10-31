'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TrashIcon } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

export type YNNGOption = {
	text: 'YES' | 'NO' | 'NOT GIVEN'
	isInteractive: boolean
}

export type YNNGQuestion = {
	questionId: string
	questionNumber: string | number
	questionText: string
	options: YNNGOption[]
	answer: {
		correct: 'YES' | 'NO' | 'NOT GIVEN'
	}
}

export type YNNGBlock = {
	type: 'yes-no-not-given'
	instructions: string[]
	headline?: string
	questionStart: string | number
	questionEnd: string | number
	inputType: 'radio'
	isInteractive: boolean
	questions: YNNGQuestion[]
}

export default function YesNoNotGivenAdmin({
	question,
	onChange,
}: {
	question: YNNGBlock
	onChange: (updatedBlock: YNNGBlock) => void
}) {
	const [block, setBlock] = useState<YNNGBlock>(question)
	const isSyncingRef = useRef(false)

	// Sync block with incoming question prop (for edit mode)
	useEffect(() => {
		isSyncingRef.current = true
		setBlock(question)
		setTimeout(() => {
			isSyncingRef.current = false
		}, 0)
	}, [question])

	useEffect(() => {
		if (!isSyncingRef.current) {
			onChange(block)
		}
	}, [block])

	// 🚀 Auto-renumber questions when questionStart changes
	useEffect(() => {
		const startNum = typeof block.questionStart === 'number' 
			? block.questionStart 
			: parseInt(block.questionStart as string) || 1
		
		const needsRenumbering = block.questions.some((q, idx) => {
			const expectedNumber = (startNum + idx).toString()
			return q.questionNumber !== expectedNumber
		})

		if (needsRenumbering) {
			const renumberedQuestions = block.questions.map((q, idx) => ({
				...q,
				questionNumber: (startNum + idx).toString()
			}))
			
			console.log('🔢 Auto-renumbering YesNoNotGiven questions:', {
				questionStart: startNum,
				questionsCount: renumberedQuestions.length,
				newNumbers: renumberedQuestions.map(q => q.questionNumber)
			})
			
			setBlock(prev => ({ ...prev, questions: renumberedQuestions }))
		}
	}, [block.questionStart])

	// 🚀 Auto-update questionEnd when questions change
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
					questionsCount: block.questions.length
				})
				
				setBlock(prev => ({ ...prev, questionEnd: expectedEnd }))
			}
		}
	}, [block.questions.length, block.questionStart])

	const addQuestion = () => {
		const startNum = typeof block.questionStart === 'number' 
			? block.questionStart 
			: parseInt(block.questionStart as string) || 1
		const nextQuestionNumber = (startNum + block.questions.length).toString()
		
		const newQuestion: YNNGQuestion = {
			questionId: `${uuidv4()}-${Date.now()}`,
			questionNumber: nextQuestionNumber,
			questionText: '',
			options: [
				{ text: 'YES', isInteractive: true },
				{ text: 'NO', isInteractive: true },
				{ text: 'NOT GIVEN', isInteractive: true },
			],
			answer: { correct: 'YES' },
		}
		setBlock({ ...block, questions: [...block.questions, newQuestion] })
	}

	const removeQuestion = (index: number) => {
		const updated = [...block.questions]
		updated.splice(index, 1)
		
		// Renumber remaining questions based on questionStart
		const startNum = typeof block.questionStart === 'number' 
			? block.questionStart 
			: parseInt(block.questionStart as string) || 1
		
		updated.forEach((q, idx) => {
			q.questionNumber = (startNum + idx).toString()
		})
		
		setBlock({ ...block, questions: updated })
	}

	const updateMetaField = (field: 'questionStart' | 'questionEnd', value: string) => {
		setBlock({ ...block, [field]: value })
	}

	const updateInstruction = (i: number, value: string) => {
		const updated = [...block.instructions]
		updated[i] = value
		setBlock({ ...block, instructions: updated })
	}

	const removeInstruction = (i: number) => {
		const updated = [...block.instructions]
		updated.splice(i, 1)
		setBlock({ ...block, instructions: updated })
	}

	const addInstruction = () => {
		setBlock({ ...block, instructions: [...block.instructions, ''] })
	}

	const updateQuestionField = (qIdx: number, field: keyof YNNGQuestion, value: string) => {
		const updated = [...block.questions]
		updated[qIdx][field] = value as any
		setBlock({ ...block, questions: updated })
	}

	const updateCorrectAnswer = (qIdx: number, answer: 'YES' | 'NO' | 'NOT GIVEN') => {
		const updated = [...block.questions]
		updated[qIdx].answer.correct = answer
		setBlock({ ...block, questions: updated })
	}

	return (
		<div className='space-y-4'>
			<div>
				<h3 className='font-semibold text-lg mb-2'>Headline</h3>
				<Input
					value={block.headline || ''}
					onChange={e => setBlock({ ...block, headline: e.target.value })}
					placeholder='Question block headline'
				/>
			</div>

			<h3 className='font-semibold text-lg'>Instructions</h3>
			{block.instructions.map((ins, idx) => (
				<div key={idx} className='relative'>
					<Textarea
						className='w-full'
						value={ins}
						onChange={e => updateInstruction(idx, e.target.value)}
					/>
					<Button
						onClick={() => removeInstruction(idx)}
						variant='ghost'
						className='absolute right-1 top-1'
					>
						<TrashIcon />
					</Button>
				</div>
			))}
			<Button onClick={addInstruction}>+ Add Instruction</Button>

			<div className='flex gap-4'>
				<Input
					className='w-40'
					type='text'
					value={block.questionStart}
					onChange={e => updateMetaField('questionStart', e.target.value)}
					placeholder='Start Number'
				/>
				<Input
					className='w-40'
					type='text'
					value={block.questionEnd}
					onChange={e => updateMetaField('questionEnd', e.target.value)}
					placeholder='End Number'
				/>
			</div>

			<h3 className='font-semibold text-lg'>Questions</h3>
			{block.questions.map((q, qIdx) => (
				<div key={qIdx} className='border rounded p-4 space-y-3 relative'>
					<Button
						variant='ghost'
						className='absolute right-2 top-2'
						onClick={() => removeQuestion(qIdx)}
					>
						<TrashIcon size={18} />
					</Button>

					<div className='flex gap-4'>
						<Input
							className='w-40'
							value={q.questionId}
							onChange={e => updateQuestionField(qIdx, 'questionId', e.target.value)}
							placeholder='Question ID'
						/>
						<Input
							className='w-32'
							value={q.questionNumber}
							onChange={e => updateQuestionField(qIdx, 'questionNumber', e.target.value)}
							placeholder='Question No.'
						/>
					</div>

					<Textarea
						className='w-full'
						value={q.questionText}
						onChange={e => updateQuestionField(qIdx, 'questionText', e.target.value)}
						placeholder='Question Text'
					/>

					<div className='space-y-2'>
						{q.options.map(opt => (
							<div key={opt.text} className='flex items-center gap-2'>
								<input
									type='radio'
									name={`correct-${qIdx}`}
									value={opt.text}
									checked={q.answer.correct === opt.text}
									onChange={() => updateCorrectAnswer(qIdx, opt.text)}
								/>
								<label>{opt.text}</label>
							</div>
						))}
					</div>
				</div>
			))}

			<Button onClick={addQuestion}>+ Add Question</Button>
		</div>
	)
}
