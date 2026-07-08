'use client'

import { Card, CardContent } from '@/components/ui/card'
import React, { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useQuestionNumbersStore } from '@/lib/stores/answeredQuestionsStore'
import { STORAGE_KEYS } from '@/lib/answerHandlers'
import { useCurrentExamSection } from '@/hooks/useCurrentExamSection'
import { processTextWithBoldAndCaps } from '@/utils/highlightAsBold'
import { StableHtml } from '@/components/exam/StableHtml'

type Props = {
	questionBlock: {
		questionId: string
		type: 'summary-select-completion'
		questionStart: number | string
		questionEnd: number | string
		instructions: string[]
		headline?: string
		text: string
		options: string[]
		answers?: { number: number; correctAnswer: string }[]
	}
	onAnswerChange?: (answers: { number: number; answer: string }[]) => void
	answer?: any
}

export default function SummarySelectCompletionExam({
	questionBlock,
	onAnswerChange,
	answer,
}: Props) {
	const pushNumber = useQuestionNumbersStore(state => state.pushNumber)
	const currentSection = useCurrentExamSection()

	const { text, instructions, questionStart, questionEnd, options } = questionBlock

	const questionNumbers = useMemo(() => {
		const start = Number(questionStart)
		const end = Number(questionEnd)
		if (isNaN(start) || isNaN(end)) return []
		return Array.from({ length: end - start + 1 }, (_, i) => start + i)
	}, [questionStart, questionEnd])

	const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({})

	// Initialize from props + localStorage
	useEffect(() => {
		const initial: Record<number, string> = {}

		if (answer && typeof answer === 'object') {
			questionNumbers.forEach(q => {
				const val = answer[q]?.value || answer[q]
				if (val) initial[q] = val
			})
		}

		let storageKey =
			currentSection === 'Reading'
				? STORAGE_KEYS.READING_ANSWERS
				: currentSection === 'Listening'
				? STORAGE_KEYS.LISTENING_ANSWERS
				: ''

		if (storageKey) {
			try {
				const storedRaw = sessionStorage.getItem(storageKey)
				const stored = storedRaw ? JSON.parse(storedRaw) : {}
				questionNumbers.forEach(q => {
					if (!initial[q] && stored[q]) {
						initial[q] = stored[q]
					}
				})
			} catch {
				// ignore parsing error
			}
		}

		// Set initial local answers
		setLocalAnswers(prev => {
			const merged = { ...prev }
			questionNumbers.forEach(q => {
				merged[q] = initial[q] || ''
			})
			return merged
		})
	}, [questionNumbers, currentSection, answer])

	// Push question numbers to store
	useEffect(() => {
		questionNumbers.forEach(pushNumber)
	}, [questionNumbers])

	// Call parent onAnswerChange
	useEffect(() => {
		if (questionNumbers.length > 0) {
			const payload = questionNumbers.map(q => ({
				number: q,
				answer: localAnswers[q] || '',
			}))
			onAnswerChange?.(payload)
		}
	}, [localAnswers, questionNumbers])

	// Handle drag & drop logic
	const updateAnswers = (updated: Record<number, string>) => {
		setLocalAnswers(updated)
	}

	const usedValues = Object.values(localAnswers).filter(Boolean)

	const handleDrop = (questionNumber: number, value: string) => {
		const updated = { ...localAnswers }

		const existingEntry = Object.entries(updated).find(([, v]) => v === value)
		if (existingEntry) {
			const [existingQ] = existingEntry
			if (updated[questionNumber]) {
				updated[existingQ] = updated[questionNumber]
			} else {
				updated[existingQ] = ''
			}
		}
		updated[questionNumber] = value
		updateAnswers(updated)
	}

	const returnToPool = (value: string) => {
		const updated = { ...localAnswers }
		for (const key in updated) {
			if (updated[key] === value) updated[key] = ''
		}
		updateAnswers(updated)
	}

	const getLabelText = (val: string) => {
		const idx = val.charCodeAt(0) - 65
		return options[idx] || val
	}

	const handleDragStart = (e: React.DragEvent<HTMLDivElement>, value: string) => {
		e.dataTransfer.setData('text/plain', value)
		e.dataTransfer.effectAllowed = 'move'
	}

	const handleDropEvent = (e: React.DragEvent<HTMLSpanElement>, qNum: number) => {
		e.preventDefault()
		const value = e.dataTransfer.getData('text/plain')
		if (value) handleDrop(qNum, value)
	}

	const handleReturnToPoolDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		const value = e.dataTransfer.getData('text/plain')
		if (value) returnToPool(value)
	}

	const parts = text.split(/ *_{4,} */g)

	return (
		<div className='relative overflow-hidden'>
			<Card className='mb-4'>
				<CardContent>
					<p>
						Questions {questionStart}-{questionEnd}
					</p>
				</CardContent>

				<CardContent>
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
						<div className='text-center w-full flex items-center justify-center mt-4'>
							<StableHtml as='p' className='font-bold' html={processTextWithBoldAndCaps(questionBlock.headline)} />
						</div>
					)}
			</CardContent>

			{/* Option Pool */}
				<CardContent onDrop={handleReturnToPoolDrop} onDragOver={e => e.preventDefault()}>
					<div className='border p-4 gap-2 flex flex-wrap items-start min-h-[40px]'>
						{options.map((text, idx) => {
							const label = String.fromCharCode(65 + idx)
							if (usedValues.includes(label)) return null

							return (
								<div
									key={label}
									draggable
									onDragStart={e => handleDragStart(e, label)}
									className={cn(
										'px-2 py-1 cursor-grab border rounded bg-muted hover:bg-muted-foreground/10'
									)}
								>
										<span className='font-bold mr-2'>{label}.</span>{' '}
										<StableHtml as='span' html={processTextWithBoldAndCaps(text)} />
									</div>
								)
						})}
					</div>
				</CardContent>

				{/* Fill-in-the-blank Drop Zones */}
				<CardContent className='space-y-4 p-4'>
					<div className='text-base leading-7'>
						{parts.map((part, i) => {
							const qNum = questionNumbers[i]
							const showDrop = i < questionNumbers.length
							const current = localAnswers[qNum]
							const display = current ? `${qNum}. ${getLabelText(current)}` : `${qNum}. `

								return (
									<React.Fragment key={i}>
										<StableHtml as='span' html={processTextWithBoldAndCaps(part)} />
										{showDrop && (
											<span
											id={`qn-${qNum}`}
											onDrop={e => handleDropEvent(e, qNum)}
											onDragOver={e => e.preventDefault()}
											draggable={!!current}
											onDragStart={(e: any) => current && handleDragStart(e, current)}
											className={cn(
												'min-w-16 inline border mx-1 p-1',
												'text-center transition-all whitespace-nowrap',
												current
													? 'border-primary text-primary font-semibold bg-muted/30 cursor-grab'
													: 'border-muted text-muted-foreground italic'
											)}
											style={{ display: 'inline-block' }}
										>
											{display}
										</span>
									)}
								</React.Fragment>
							)
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
