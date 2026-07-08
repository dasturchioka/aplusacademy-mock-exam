'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Trash, TrashIcon, Plus } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface Option {
	variant: string
	text: string
	isInteractive: boolean
}

interface QuestionItem {
	questionId: string
	questionText: string
	options: Option[]
	questionNumber: string | number
	answer: {
		correct: string
		accepted: string[]
	}
}

// Updated to match all-tests.json structure exactly
interface QuestionBlock {
	id: string
	type: 'multiple-choice'
	instructions: string[]
	headline?: string
	questionStart: number | string
	questionEnd: number | string
	inputType: 'radio'
	answerConstraints: string
	isInteractive: boolean
	questions: QuestionItem[]
}

export default function MultipleChoiceAdmin({
	question,
	onChange,
}: {
	question: QuestionBlock
	onChange: (updatedBlock: QuestionBlock) => void
}) {
	const [block, setBlock] = useState<QuestionBlock>(question)
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
			
			console.log('🔢 Auto-renumbering MultipleChoice questions:', {
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

	// 🚀 REAL-TIME COMPONENT LOGGING (Separate useEffect to prevent infinite loops)
	useEffect(() => {
		const timeout = setTimeout(() => {
			console.log('🎯 MultipleChoice Component Updated:', {
				type: block.type,
				questionRange: `${block.questionStart}-${block.questionEnd}`,
				questionsCount: block.questions.length,
				questionsWithAnswers: block.questions.filter(q => q.answer.correct).length,
				fullStructure: block
			})
		}, 0)
		
		return () => clearTimeout(timeout)
	}, [block])

	const updateBlockField = <K extends keyof QuestionBlock>(key: K, value: QuestionBlock[K]) => {
		setBlock({ ...block, [key]: value })
	}

	const updateQuestionText = (idx: number, text: string) => {
		const updated = [...block.questions]
		updated[idx].questionText = text
		setBlock({ ...block, questions: updated })
	}

	const updateQuestionNumber = (idx: number, value: string) => {
		const updated = [...block.questions]
		updated[idx].questionNumber = value
		setBlock({ ...block, questions: updated })
	}

	const updateQuestionId = (idx: number, value: string) => {
		const updated = [...block.questions]
		updated[idx].questionId = value
		setBlock({ ...block, questions: updated })
	}

	const updateOptionText = (qIdx: number, oIdx: number, text: string) => {
		const updated = [...block.questions]
		updated[qIdx].options[oIdx].text = text
		setBlock({ ...block, questions: updated })
	}

	const updateOptionVariant = (qIdx: number, oIdx: number, variant: string) => {
		const updated = [...block.questions]
		const oldVariant = updated[qIdx].options[oIdx].variant
		updated[qIdx].options[oIdx].variant = variant

		// Update correct answer if it was the changed option
		if (block.questions[qIdx].answer.correct === oldVariant) {
			updated[qIdx].answer.correct = variant
		}

		setBlock({ ...block, questions: updated })
	}

	const updateCorrectAnswer = (qIdx: number, variant: string) => {
		const updated = [...block.questions]
		updated[qIdx].answer.correct = variant
		setBlock({ ...block, questions: updated })
	}

	const addOption = (qIdx: number) => {
		const newVariant = String.fromCharCode(65 + block.questions[qIdx].options.length)
		const newOption: Option = { variant: newVariant, text: '', isInteractive: true }
		const updatedQuestions = [...block.questions]
		updatedQuestions[qIdx].options.push(newOption)
		setBlock({ ...block, questions: updatedQuestions })
	}

	const removeOption = (qIdx: number, oIdx: number) => {
		const updatedQuestions = [...block.questions]
		const q = updatedQuestions[qIdx]
		const removed = q.options.splice(oIdx, 1)[0]

		// Re-letter remaining options
		q.options = q.options.map((opt, i) => ({
			...opt,
			variant: String.fromCharCode(65 + i),
		}))

		// Reset correct answer if removed option was selected
		if (q.answer.correct === removed.variant) q.answer.correct = q.options[0]?.variant || ''

		setBlock({ ...block, questions: updatedQuestions })
	}

	const updateInstructions = (index: number, value: string) => {
		const updatedInstructions = [...block.instructions]
		updatedInstructions[index] = value
		setBlock({ ...block, instructions: updatedInstructions })
	}

	const addInstruction = () => {
		setBlock({ ...block, instructions: [...block.instructions, ''] })
	}

	const removeInstruction = (idx: number) => {
		const updated = [...block.instructions]
		updated.splice(idx, 1)
		setBlock({ ...block, instructions: updated })
	}

	const addQuestion = () => {
		const startNum = typeof block.questionStart === 'number' 
			? block.questionStart 
			: parseInt(block.questionStart as string) || 1
		const newQuestionNumber = (startNum + block.questions.length).toString()
		
		const newQuestion: QuestionItem = {
			questionId: `${uuidv4()}-${Date.now()}`,
			questionText: '',
			options: [
				{ variant: 'A', text: '', isInteractive: true },
				{ variant: 'B', text: '', isInteractive: true },
				{ variant: 'C', text: '', isInteractive: true },
			],
			questionNumber: newQuestionNumber,
			answer: {
				correct: 'A',
				accepted: [],
			},
		}
		
		// 🚀 REAL-TIME QUESTION ADDITION LOGGING
		console.log('➕ Added question to MultipleChoice:', {
			newQuestionNumber: newQuestionNumber,
			questionId: newQuestion.questionId,
			totalQuestions: block.questions.length + 1,
			optionsCount: newQuestion.options.length,
			addedQuestion: newQuestion
		})
		
		setBlock({ ...block, questions: [...block.questions, newQuestion] })
	}

	const removeQuestion = (qIdx: number) => {
		const removedQuestion = block.questions[qIdx]
		const updatedQuestions = [...block.questions]
		updatedQuestions.splice(qIdx, 1)
		
		// Renumber remaining questions based on questionStart
		const startNum = typeof block.questionStart === 'number' 
			? block.questionStart 
			: parseInt(block.questionStart as string) || 1
		
		updatedQuestions.forEach((q, idx) => {
			q.questionNumber = (startNum + idx).toString()
		})
		
		// 🚀 REAL-TIME QUESTION REMOVAL LOGGING
		console.log('❌ Removed question from MultipleChoice:', {
			removedIndex: qIdx,
			removedQuestionId: removedQuestion.questionId,
			removedQuestionNumber: removedQuestion.questionNumber,
			remainingQuestions: updatedQuestions.length,
			removedQuestion: removedQuestion
		})
		
		setBlock({ ...block, questions: updatedQuestions })
	}

	return (
		<div className='space-y-4'>
			{/* Block Metadata */}
			<div className='grid grid-cols-2 gap-4'>
				<div>
					<Label className='text-sm'>Question Start</Label>
					<Input
						type="number"
						value={block.questionStart}
						onChange={e => updateBlockField('questionStart', parseInt(e.target.value))}
					/>
				</div>
				<div>
					<Label className='text-sm'>Question End</Label>
					<Input
						type="number"
						value={block.questionEnd}
						onChange={e => updateBlockField('questionEnd', parseInt(e.target.value))}
					/>
				</div>
			</div>

			<div>
				<Label className='text-sm'>Headline</Label>
				<Input
					value={block.headline || ''}
					onChange={e => updateBlockField('headline', e.target.value)}
					placeholder='Question block headline'
				/>
			</div>

			{/* Instructions */}
			<div>
				<Label className='text-sm font-semibold'>Instructions</Label>
				<div className='space-y-2 mt-2'>
					{block.instructions.map((instr, idx) => (
						<div key={idx} className='flex gap-2 items-center'>
							<Textarea
								value={instr}
								onChange={e => updateInstructions(idx, e.target.value)}
								className='flex-1'
								rows={2}
							/>
							<Button
								type='button'
								size='icon'
								variant='ghost'
								className='text-red-500'
								onClick={() => removeInstruction(idx)}
							>
								<Trash />
							</Button>
						</div>
					))}
					<Button type='button' variant='outline' onClick={addInstruction}>
						<Plus className='w-4 h-4 mr-2' />
						Add Instruction
					</Button>
				</div>
			</div>

			{/* Answer Constraints
			<div>
				<Label className='text-sm'>Answer Constraints</Label>
				<Input
					value={block.answerConstraints}
					onChange={e => updateBlockField('answerConstraints', e.target.value)}
					placeholder="e.g., ONE WORD AND/OR A NUMBER"
				/>
			</div> */}

			{/* Questions */}
			<div className='space-y-4'>
				<Label className='text-sm font-semibold'>Questions</Label>
				{block.questions.map((q, qIdx) => (
					<div key={qIdx} className='border rounded p-4 space-y-3'>
						<div className='flex items-center justify-between'>
							<Label className='font-medium'>Question {qIdx + 1}</Label>
							<Button onClick={() => removeQuestion(qIdx)} size='icon' variant='destructive'>
								<TrashIcon size={16} />
							</Button>
						</div>

						<div className='grid grid-cols-2 gap-2'>
							<div>
								<Label className='text-sm'>Question ID</Label>
								<Input
									value={q.questionId}
									onChange={e => updateQuestionId(qIdx, e.target.value)}
									placeholder='Auto-generated UUID'
									readOnly
								/>
							</div>
							<div>
								<Label className='text-sm'>Question Number</Label>
								<Input
									value={q.questionNumber}
									onChange={e => updateQuestionNumber(qIdx, e.target.value)}
									placeholder='1'
								/>
							</div>
						</div>

						<div>
							<Label className='text-sm'>Question Text</Label>
							<Textarea
								value={q.questionText}
								onChange={e => updateQuestionText(qIdx, e.target.value)}
								placeholder={`Question ${qIdx + 1} text`}
								rows={2}
							/>
						</div>

						{/* Options */}
						<div className='space-y-2'>
							<Label className='text-sm'>Options</Label>
							{q.options.map((opt, oIdx) => (
								<div key={opt.variant} className='flex items-center gap-2'>
									<Input
										className='w-12'
										value={opt.variant}
										onChange={e => updateOptionVariant(qIdx, oIdx, e.target.value)}
										placeholder='A'
									/>
									<Input
										className='flex-1'
										value={opt.text}
										onChange={e => updateOptionText(qIdx, oIdx, e.target.value)}
										placeholder={`Option ${opt.variant} text`}
									/>
									<input
										type='radio'
										name={`correct-${q.questionId}`}
										checked={q.answer.correct === opt.variant}
										onChange={() => updateCorrectAnswer(qIdx, opt.variant)}
									/>
									<Label className='text-sm'>Correct</Label>
									<Button onClick={() => removeOption(qIdx, oIdx)} size='icon' variant='destructive'>
										<TrashIcon size={16} />
									</Button>
								</div>
							))}
							<Button onClick={() => addOption(qIdx)} variant='outline'>
								<Plus className='w-4 h-4 mr-2' />
								Add Option
							</Button>
						</div>
					</div>
				))}
			</div>

			<Button onClick={addQuestion} className='mt-4'>
				<Plus className='w-4 h-4 mr-2' />
				Add Question
			</Button>
		</div>
	)
}