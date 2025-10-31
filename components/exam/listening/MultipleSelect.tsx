'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useQuestionNumbersStore } from '@/lib/stores/answeredQuestionsStore'
import { STORAGE_KEYS } from '@/lib/answerHandlers'
import { useCurrentExamSection } from '@/hooks/useCurrentExamSection'
import { useEffect, useState } from 'react'
import { processTextWithBoldAndCaps } from '@/utils/highlightAsBold'

type Choice = {
	variant: string
	text: string
}

// Updated to match admin component structure
interface MultipleSelectBlock {
	id?: string
	type: 'multiple-select'
	questionStart: number | string
	questionEnd: number | string
	instructions?: string[]
	headline?: string
	questionId?: string
	questionText: string
	choices: Choice[]
}

type Props = {
	data: MultipleSelectBlock
	onAnswerChange?: (answer: { number: number; answer: string }[]) => void
}

function range(start: number, end: number): number[] {
	const s = Number(start)
	const e = Number(end)
	return Array.from({ length: e - s + 1 }, (_, i) => s + i)
}

export default function MultipleSelectExam({ data, onAnswerChange }: Props) {
	const pushNumber = useQuestionNumbersStore(state => state.pushNumber)
	const currentSection = useCurrentExamSection()
	const [selected, setSelected] = useState<string[]>([])

	const questionNumbers = range(+data.questionStart, +data.questionEnd)

	const toggleChoice = (variant: string) => {
		let updated: string[]
		if (selected.includes(variant)) {
			updated = selected.filter(v => v !== variant)
		} else {
			updated = [...selected, variant].slice(0, questionNumbers.length)
		}
		setSelected(updated)

		const answers = updated.map((variant, idx) => ({
			number: questionNumbers[idx],
			answer: variant,
		}))

		onAnswerChange?.(answers)
	}

	// Register question numbers once
	useEffect(() => {
		questionNumbers.forEach(n => pushNumber(n))
	}, [])

	// Load answers from localStorage once
	useEffect(() => {
		const storageKey =
			currentSection === 'Listening'
				? STORAGE_KEYS.LISTENING_ANSWERS
				: currentSection === 'Reading'
				? STORAGE_KEYS.READING_ANSWERS
				: STORAGE_KEYS.WRITING_ANSWERS

		const raw = sessionStorage.getItem(storageKey) || '{}'
		const storedAnswers = JSON.parse(raw) as Record<string, string>

		const restored: { number: number; answer: string }[] = []
		const variants: string[] = []

		questionNumbers.forEach(n => {
			const answer = storedAnswers[n]
			if (answer) {
				restored.push({ number: n, answer })
				variants.push(answer)
			}
		})

		if (restored.length > 0) {
			setSelected(variants)
			onAnswerChange?.(restored)
		}
	}, [])
	
	return (
		<Card className='space-y-4 p-4'>
			<CardContent className='space-y-2'>
				<div className='text-sm text-muted-foreground'>
					Question {data.questionStart}–{data.questionEnd}
				</div>

				<div className='text-lg font-semibold' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(data.questionText) }} />

				{questionNumbers.map(qn => (
					<div key={qn} id={`qn-${qn}`} className='p-2' />
				))}

			{data.instructions?.map((text, idx) => (
				<div key={idx} className='text-sm text-muted-foreground' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(text) }} />
			))}

			{/* Headline */}
			{data.headline && (
				<div className='text-center w-full flex items-center justify-center mt-4 mb-2'>
					<p className='font-bold' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(data.headline) }} />
				</div>
			)}

			<div className='mt-4 space-y-3'>
					{data.choices.map((choice, idx) => (
						<div
							key={idx}
							className={`flex items-center gap-2 p-2 rounded-md border ${
								selected.includes(choice.variant) ? 'border-primary bg-primary/10' : 'border-muted'
							} transition cursor-pointer`}
							onClick={() => toggleChoice(choice.variant)}
						>
							<Checkbox checked={selected.includes(choice.variant)} />
							<Label className='cursor-pointer'>
								<span className='font-semibold mr-1'>{choice.variant}.</span> <span dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(choice.text) }} />
							</Label>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
