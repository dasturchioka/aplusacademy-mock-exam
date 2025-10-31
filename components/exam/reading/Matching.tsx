'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { useQuestionNumbersStore } from '@/lib/stores/answeredQuestionsStore'
import { STORAGE_KEYS } from '@/lib/answerHandlers'
import { useCurrentExamSection } from '@/hooks/useCurrentExamSection'
import { processTextWithBoldAndCaps } from '@/utils/highlightAsBold'

type Variant = {
	variant?: string
	text: string
	label: string
}

type Pair = {
	number: number
	item: string
	isInteractive: boolean
	match?: string
}

type Props = {
	data: {
		questionStart: string
		questionEnd: string
		instructions: string[]
		pairs: Pair[]
		type: string
		options: Variant[]
		optionsAtATime?: string | number | null
		headline?: string
		optionsHeadline?:string
	}
	onAnswerChange: (newAnswers: Record<string, string>) => void
	userAnswers: Record<string, string>
}

export default function ReadingMatchingExam({ data, onAnswerChange }: Props) {
	const pushNumber = useQuestionNumbersStore(state => state.pushNumber)
	const currentSection = useCurrentExamSection()
	const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({})

	// Load stored answers once on mount
	useEffect(() => {
		const answersInStorage = JSON.parse(
			sessionStorage.getItem(
				currentSection === 'Listening'
					? STORAGE_KEYS.LISTENING_ANSWERS
					: STORAGE_KEYS.READING_ANSWERS
			) || '{}'
		)

		const start = parseInt(data.questionStart)
		const end = parseInt(data.questionEnd)

		const relevantAnswers: Record<string, string> = {}
		for (let i = start; i <= end; i++) {
			const key = String(i)
			if (answersInStorage[key]) {
				relevantAnswers[key] = answersInStorage[key]
			}
		}
		if (Object.keys(relevantAnswers).length > 0) {
			setLocalAnswers(relevantAnswers)
			requestAnimationFrame(() => {
				onAnswerChange(relevantAnswers)
			})
		}
	}, [])

	const optionsAtATime = useMemo(() => {
		const val = parseInt(data.optionsAtATime as string)
		return isNaN(val) || val <= 0 ? 1 : val
	}, [data.optionsAtATime])

	const getOptionUsageCount = (variant: string) =>
		Object.values(localAnswers).filter(v => v === variant).length

	const handleCellClick = (questionNumber: string, optionVariant: string) => {
		setLocalAnswers(prev => {
			const updated = { ...prev }

			if (updated[questionNumber] === optionVariant) {
				delete updated[questionNumber]
			} else {
				const usage = getOptionUsageCount(optionVariant)
				if (usage >= optionsAtATime) return prev
				updated[questionNumber] = optionVariant
			}

			return updated
		})
	}

	useEffect(() => {
		onAnswerChange(localAnswers)
	}, [localAnswers])

	useEffect(() => {
		const storageKey =
			currentSection === 'Listening' ? STORAGE_KEYS.LISTENING_ANSWERS : STORAGE_KEYS.READING_ANSWERS

		// Read existing storage and update it with the new localAnswers
		const current = JSON.parse(sessionStorage.getItem(storageKey) || '{}')

		// Remove old question numbers from storage in the current section range
		const start = parseInt(data.questionStart)
		const end = parseInt(data.questionEnd)

		for (let i = start; i <= end; i++) {
			delete current[String(i)]
		}

		// Merge updated answers
		const updatedStorage = { ...current, ...localAnswers }

		sessionStorage.setItem(storageKey, JSON.stringify(updatedStorage))
		window.dispatchEvent(new Event('answersUpdated'))
	}, [localAnswers, currentSection])

	const isMatchingParagraphs = data.type === 'matching-paragraphs'

	useEffect(() => {
		const range = (start: number, end: number): number[] =>
			Array.from({ length: end - start + 1 }, (_, i) => start + i)

		const numbers = range(+data.questionStart, +data.questionEnd)
		numbers.forEach(pushNumber)
	}, [])

	return (
		<div>
			<Label className='text-sm mb-1'>
				<div className='text-sm text-muted-foreground mb-4'>
					Question {data.questionStart}–{data.questionEnd}
				</div>
			<div className='instructions space-y-2 mb-4'>
				{data.instructions.map((line, idx) => (
					<div key={idx} dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(line) }} />
				))}
			</div>
		</Label>

		{/* Headline */}
		{data.headline && (
			<div className='text-center w-full flex items-center justify-center mb-4'>
				<p className='font-bold' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(data.headline) }} />
			</div>
		)}

		{/* Reference Section */}
			<div className='space-y-3 flex flex-col items-start mb-4'>
				{!isMatchingParagraphs ? (
					<>
						<h4 className='font-semibold text-sm text-muted-foreground'>Options Reference:</h4>
						<div className='flex flex-col items-start border w-auto'>
							{data.optionsHeadline ? <p dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(data.optionsHeadline) }} /> : null}
							{data.options.map(option => (
								<div key={option.variant || option.label} className='p-3'>
									<div className='p-0 flex items-center gap-2'>
										<div className='font-semibold text-sm'>{option.variant || option.label}. </div>
										<div className='text-sm text-muted-foreground' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(option.text) }} />
									</div>
								</div>
							))}
						</div>
					</>
				) : (
					<>
						<h4 className='font-semibold text-sm text-muted-foreground'>Questions Reference:</h4>
						<div className='flex flex-col items-start border w-auto text-sm'>
							{data.pairs.map(pair => (
								<div key={pair.number} className='px-3 py-2 leading-snug'>
									<span className='font-semibold'>{pair.number}.</span> <span dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(pair.item) }} />
								</div>
							))}
						</div>
					</>
				)}
			</div>

			{/* Matching Table */}
			<div className='mb-6 overflow-x-auto'>
				<table className='w-full border-collapse border border-gray-300'>
					<thead>
						<tr>
							<th className='border border-gray-300 p-2 bg-gray-50 text-left font-semibold'>
								Questions
							</th>
							{data.options.map(option => (
								<th
									key={option.variant || option.label}
									className='border border-gray-300 p-2 bg-gray-50 text-center font-semibold min-w-[80px]'
								>
									{option.variant || option.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data.pairs.map(pair => (
							<tr id={`qn-${pair.number}`} key={pair.number}>
								<td
									className={`border border-gray-300 font-semibold bg-gray-50 ${
										!isMatchingParagraphs ? 'w-[700px]' : ''
									} p-2`}
								>
									{pair.number}.{!isMatchingParagraphs && <span> <span dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(pair.item) }} /></span>}
								</td>
								{data.options.map(option => {
									const variant = option.variant || option.label
									const selected = localAnswers[String(pair.number)] === variant
									const disabled = !selected && getOptionUsageCount(variant) >= optionsAtATime

									return (
										<td
											key={variant}
											className={cn(
												'border border-gray-300 p-2 text-center cursor-pointer transition-colors hover:bg-gray-100',
												selected && 'bg-green-100 hover:bg-green-200',
												disabled && 'cursor-not-allowed opacity-50'
											)}
											onClick={() => !disabled && handleCellClick(String(pair.number), variant)}
										>
											{selected && <Check className='w-5 h-5 text-green-600 mx-auto' />}
										</td>
									)
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
