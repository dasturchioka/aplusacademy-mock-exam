'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCurrentExamSection } from '@/hooks/useCurrentExamSection'
import { STORAGE_KEYS } from '@/lib/answerHandlers'
import { JSX, useEffect, useState } from 'react'
import { processTextWithBoldAndCaps } from '@/utils/highlightAsBold'

type Question = {
	isInteractive: boolean
	number?: string
	text: string
	questionId?: string
}

type DiagramLabellingExamProps = {
	question: {
		questionStart: string
		questionEnd: string
		type: 'diagram-labelling'
		instructions: string[]
		headline?: string
		image: {
			headline: string
			url: string
		}
		questions: Question[]
	}
	onAnswerChange: (answers: { [key: string]: string }[]) => void
}

type Answer = {
	number: number
	answer: string
}

export default function DiagramLabellingExam({
	question,
	onAnswerChange,
}: DiagramLabellingExamProps) {
	const currentSection = useCurrentExamSection()
	const [answers, setAnswers] = useState<Answer[]>([])

	// Collect all question numbers based on start/end
	const collectNumbersFromRange = () => {
		const start = parseInt(question.questionStart)
		const end = parseInt(question.questionEnd)
		if (!isNaN(start) && !isNaN(end) && end >= start) {
			return Array.from({ length: end - start + 1 }, (_, i) => start + i)
		}
		// fallback: use interactive question numbers from list
		return question.questions.filter(q => q.isInteractive && q.number).map(q => parseInt(q.number!))
	}

	useEffect(() => {
		const key =
			currentSection === 'Listening' ? STORAGE_KEYS.LISTENING_ANSWERS : STORAGE_KEYS.READING_ANSWERS

		const stored = sessionStorage.getItem(key)
		const parsed: Record<string, string> = stored ? JSON.parse(stored) : {}

		const allNumbers = collectNumbersFromRange()
		const initial = allNumbers.map(num => ({
			number: num,
			answer: parsed[num] || '',
		}))

		setAnswers(initial)
	}, [question, currentSection])

	useEffect(() => {
		onAnswerChange(answers)
	}, [answers])

	const handleAnswerChange = (questionNumber: number, value: string) => {
		setAnswers(prev =>
			prev.map(ans =>
				ans.number === questionNumber ? { number: questionNumber, answer: value } : ans
			)
		)
	}

	const renderTextWithInputs = (text: string, questionNumbers: number[]) => {
		const parts = text.split(/_{4,}|____/g)
		const rendered: JSX.Element[] = []

		parts.forEach((part, idx) => {
			rendered.push(<span key={`p-${idx}`} dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(part) }} />)
			if (idx < questionNumbers.length) {
				const qn = questionNumbers[idx]
				const currentAnswer = answers.find(a => a.number === qn)?.answer || ''
				rendered.push(
					<Input
						key={`input-${qn}`}
						id={`qn-${qn}`}
						value={currentAnswer}
						onChange={e => handleAnswerChange(qn, e.target.value)}
						className='inline-block w-40 mx-2'
						placeholder={qn.toString()}
					/>
				)
			}
		})

		return rendered
	}

	return (
		<div className='space-y-6'>
			<p className='text-gray-700 italic'>
				Questions {question.questionStart}-{question.questionEnd}
			</p>
			{/* Instructions */}
			<div className='space-y-1'>
				{question.instructions.map((line, i) => (
					<p key={i} className='text-sm text-muted-foreground' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(line) }} />
				))}
			</div>

			{/* Headline */}
			{question.headline && (
				<div className='text-center w-full flex items-center justify-center'>
					<p className='font-bold' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(question.headline) }} />
				</div>
			)}

			{/* Image */}
			{question.image?.url && (
				<div>
					<p className='font-semibold' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(question.image.headline) }} />
					<img src={question.image.url} alt='Diagram' className='max-w-full mt-2 border rounded' />
				</div>
			)}

			{/* Questions */}
			<div className='space-y-4'>
				{question.questions.map((q, idx) => {
					if (!q.isInteractive) return null

					// If using question range, assign numbers sequentially for placeholders
					let qNumbers: number[] = []
					if (question.questionStart && question.questionEnd) {
						const start = parseInt(question.questionStart)
						const end = parseInt(question.questionEnd)
						if (!isNaN(start) && !isNaN(end) && end >= start) {
							// slice the range based on number of placeholders in this text
							const placeholders = (q.text.match(/_{4,}|____/g) || []).length
							const base = start + idx * placeholders
							qNumbers = Array.from({ length: placeholders }, (_, i) => base + i)
						}
					} else if (q.number) {
						qNumbers = [parseInt(q.number)]
					}

					return (
						<div key={idx}>
							<Label>{renderTextWithInputs(q.text, qNumbers)}</Label>
						</div>
					)
				})}
			</div>
		</div>
	)
}
