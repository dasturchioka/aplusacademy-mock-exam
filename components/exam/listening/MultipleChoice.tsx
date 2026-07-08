'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useQuestionNumbersStore } from '@/lib/stores/answeredQuestionsStore'
import { STORAGE_KEYS } from '@/lib/answerHandlers'
import { useEffect, useState } from 'react'
import { useCurrentExamSection } from '@/hooks/useCurrentExamSection'
import { processTextWithBoldAndCaps } from '@/utils/highlightAsBold'
import { StableHtml } from '@/components/exam/StableHtml'

interface Option {
	variant: string
	text: string
	isInteractive: boolean
}

interface QuestionItem {
	questionId: string
	questionText: string
	options: Option[]
	questionNumber: string
	answer: {
		correct: string
		accepted: string[]
	}
}

interface QuestionBlock {
	type: 'multiple-choice'
	instructions: string[]
	questionStart: number | string
	questionEnd: number | string
	inputType: 'radio'
	answerConstraints: string
	isInteractive: boolean
	headline?: string
	questions: QuestionItem[]
}

export default function MultipleChoiceExam({
	question,
	onAnswerChange,
}: {
	question: QuestionBlock
	onAnswerChange: (answers: { number: number; answer: string }[]) => void
}) {
	const questionNumbers = useQuestionNumbersStore(state => state.questionNumbers)
	const pushNumber = useQuestionNumbersStore(state => state.pushNumber)
	const currentSection = useCurrentExamSection()

	const [answers, setAnswers] = useState<{ number: number; answer: string }[]>([])

	const handleChange = (questionNumber: string, variant: string) => {
		const updated = [
			...answers.filter(ans => ans.number !== parseInt(questionNumber)),
			{ number: parseInt(questionNumber), answer: variant },
		]
		setAnswers(updated)
		onAnswerChange(updated)
	}

	useEffect(() => {
		const start = +question.questionStart
		const end = +question.questionEnd

		// Push question numbers to the store
		for (let i = start; i <= end; i++) {
			pushNumber(i)
		}

		// Load answers from the correct localStorage key
		const storageKey =
			currentSection === 'Listening' ? STORAGE_KEYS.LISTENING_ANSWERS : STORAGE_KEYS.READING_ANSWERS

		const storedAnswers = JSON.parse(sessionStorage.getItem(storageKey) || '{}')

		const loadedAnswers = Object.entries(storedAnswers)
			.filter(([key]) => {
				const num = parseInt(key)
				return num >= start && num <= end
			})
			.map(([key, value]) => ({
				number: parseInt(key),
				answer: value,
			}))

		if (loadedAnswers.length > 0) {
			setAnswers(loadedAnswers)
			onAnswerChange(loadedAnswers)
		}
	}, [])

	return (
		<div className='space-y-4'>
			<Label className='text-sm mb-10'>
				<div className='text-sm text-muted-foreground mb-4'>
					Question {question.questionStart}–{question.questionEnd}
				</div>
					<div className='instructions space-y-2 mb-8'>
						{question.instructions?.map((line, idx) => (
							<StableHtml key={idx} as='div' html={processTextWithBoldAndCaps(line)} />
						))}
					</div>
				</Label>

			{/* Headline */}
			{question.headline && (
				<div className='text-center w-full flex items-center justify-center mb-4'>
					<StableHtml as='p' className='font-bold' html={processTextWithBoldAndCaps(question.headline)} />
				</div>
			)}

			{question.questions.map((q, idx) => (
					<div key={q.questionId} className='space-y-2'>
						<p id={`qn-${q.questionNumber}`} className='font-medium'>
							{Number(question.questionStart) + idx}. <StableHtml as='span' html={processTextWithBoldAndCaps(q.questionText)} />
						</p>

					<RadioGroup
						value={answers.find(a => a.number === parseInt(q.questionNumber))?.answer ?? ''}
						onValueChange={val => handleChange(q.questionNumber, val)}
						className='space-y-1'
					>
						{q.options.map(opt => (
							<div key={opt.variant} className='flex items-center gap-2'>
								<RadioGroupItem
									id={`${q.questionId}-${opt.variant}`}
									value={opt.variant}
									disabled={!opt.isInteractive}
									className='accent-primary'
								/>
								<label htmlFor={`${q.questionId}-${opt.variant}`} className='cursor-pointer'>
									<strong>{opt.variant}.</strong> <StableHtml as='span' html={processTextWithBoldAndCaps(opt.text)} />
								</label>
							</div>
						))}
					</RadioGroup>
				</div>
			))}
		</div>
	)
}
