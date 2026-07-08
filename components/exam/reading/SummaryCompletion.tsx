'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useQuestionNumbersStore } from '@/lib/stores/answeredQuestionsStore'
import { useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/answerHandlers'
import { useCurrentExamSection } from '@/hooks/useCurrentExamSection'
import { processTextWithBoldAndCaps } from '@/utils/highlightAsBold'
import React from 'react'
import { StableHtml } from '@/components/exam/StableHtml'
import { AppAlert } from '@/components/ui/app-alert'

type Props = {
	questionBlock: {
		questionId: string
		type: 'summary-completion'
		questionStart: number | string
		questionEnd: number | string
		headline?: string
		instructions: string[]
		text?: string
		answers?: { number: number; correctAnswer: string }[]
	}
	onAnswerChange?: (answers: { number: number; answer: string }[]) => void
	answer?: any
}

export default function SummaryCompletionExam({ questionBlock, onAnswerChange, answer }: Props) {
	const pushNumber = useQuestionNumbersStore(state => state.pushNumber)
	const currentSection = useCurrentExamSection()
	const { text, instructions, questionStart, questionEnd } = questionBlock

	const questionNumbers = useMemo(
		() =>
			Array.from(
				{ length: Number(questionEnd) - Number(questionStart) + 1 },
				(_, i) => Number(questionStart) + i
			),
		[questionStart, questionEnd]
	)

	const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({})

	// Load answers from props or localStorage on mount
	useEffect(() => {
		const newAnswers: Record<number, string> = {}

		// Populate from props
		if (answer && typeof answer === 'object') {
			questionNumbers.forEach(n => {
				if (answer[n.toString()]) {
					newAnswers[n] = answer[n.toString()].value || answer[n.toString()]
				} else if (answer[n]) {
					newAnswers[n] = answer[n].value || answer[n]
				}
			})
		}

		// Fallback to localStorage
		const storageKey =
			currentSection === 'Reading' ? STORAGE_KEYS.READING_ANSWERS : STORAGE_KEYS.LISTENING_ANSWERS

		const storedRaw = sessionStorage.getItem(storageKey) || '{}'
		const storedAnswers = JSON.parse(storedRaw) as Record<string, string>

		questionNumbers.forEach(n => {
			if (!newAnswers[n] && storedAnswers[n]) {
				newAnswers[n] = storedAnswers[n]
			}
		})

		setLocalAnswers(newAnswers)
	}, [answer, currentSection, questionNumbers])

	// Sync local answers to parent
	useEffect(() => {
		const answerArray = questionNumbers.map(number => ({
			number,
			answer: localAnswers[number] || '',
		}))
		onAnswerChange?.(answerArray)
	}, [localAnswers, questionNumbers, onAnswerChange])

	// Sync local answers to localStorage
	useEffect(() => {
		const storageKey =
			currentSection === 'Reading' ? STORAGE_KEYS.READING_ANSWERS : STORAGE_KEYS.LISTENING_ANSWERS

		const current = JSON.parse(sessionStorage.getItem(storageKey) || '{}')

		// Remove existing entries for these questions
		questionNumbers.forEach(n => delete current[n])

		// Merge new answers
		const updated = { ...current, ...localAnswers }

		sessionStorage.setItem(storageKey, JSON.stringify(updated))
	}, [localAnswers, currentSection, questionNumbers])

	// Register question numbers once
	useEffect(() => {
		questionNumbers.forEach(pushNumber)
	}, [questionNumbers, pushNumber])

	const parts = text
		? text.split(/ *_{4,} */g)
		: ['No text available for this summary completion exercise.']

	const handleChange = (number: number, value: string) => {
		setLocalAnswers(prev => ({ ...prev, [number]: value }))
	}

	return (
		<Card className='mb-4'>
				<CardContent className='space-y-4 p-4'>
					{instructions.map((inst, i) => (
						<StableHtml
							key={i}
							as='p'
							className='text-muted-foreground'
							html={processTextWithBoldAndCaps(inst)}
						/>
					))}

				{/* Headline */}
				{questionBlock.headline && (
					<div className='text-center w-full flex items-center justify-center my-4'>
						<p className='font-bold'>{questionBlock.headline}</p>
					</div>
				)}

				{!text && (
					<AppAlert tone='warning' title='Text missing'>
						Text content is missing for this summary completion block.
					</AppAlert>
				)}

				<div className='text-base leading-7'>
					{parts.map((part, i) => {
						const showInput = i < questionNumbers.length && text
						const number = questionNumbers[i]

							return (
								<React.Fragment key={i}>
									<StableHtml as='span' html={part} />
									{showInput && (
										<Input
										type='text'
										value={localAnswers[number] || ''}
										onChange={e => handleChange(number, e.target.value)}
										placeholder={`${number}`}
										id={`qn-${number}`}
										className='w-24 inline-block mx-1'
									/>
								)}
							</React.Fragment>
						)
					})}
				</div>
			</CardContent>
		</Card>
	)
}
