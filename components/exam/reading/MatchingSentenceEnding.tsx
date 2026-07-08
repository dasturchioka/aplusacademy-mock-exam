'use client'

import { Label } from '@/components/ui/label'
import { useCurrentExamSection } from '@/hooks/useCurrentExamSection'
import { QuestionHandlers, STORAGE_KEYS } from '@/lib/answerHandlers'
import { cn } from '@/lib/utils'
import { processTextWithBoldAndCaps } from '@/utils/highlightAsBold'
import { Ref, useEffect, useMemo, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { StableHtml } from '@/components/exam/StableHtml'

type Option = {
	variant?: string
	text: string
	label: string
}

type Pair = {
	number: string
	item: string // sentence beginning
	isInteractive: boolean
	match?: string
}

type Props = {
	data: {
		questionStart: string
		questionEnd: string
		instructions: string[]
		pairs: Pair[]
		options: Option[]
		optionsAtATime?: string | number | null
		headline?: string
	}
	onAnswerChange: (newAnswers: Record<string, string>) => void
	userAnswers: Record<string, string>
}

type DragItem = {
	type: 'option'
	variant: string
}

export default function MatchingSentenceEndingsExam({ data, onAnswerChange, userAnswers }: Props) {
	const currentSection = useCurrentExamSection()
	const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(userAnswers || {})

	const variantToText = useMemo(() => {
		const map: Record<string, string> = {}
		data.options.forEach(opt => {
			const variant = opt.variant || opt.label
			map[variant] = opt.text
		})
		return map
	}, [data.options])

	useEffect(() => {
		const storageKey =
			currentSection === 'Listening' ? STORAGE_KEYS.LISTENING_ANSWERS : STORAGE_KEYS.READING_ANSWERS

		const storedAnswers = JSON.parse(sessionStorage.getItem(storageKey) || '{}')

		const start = parseInt(data.questionStart)
		const end = parseInt(data.questionEnd)
		const relevant: Record<string, string> = {}

		for (let i = start; i <= end; i++) {
			const key = String(i)
			if (storedAnswers[key]) {
				relevant[key] = storedAnswers[key]
			}
		}

		setLocalAnswers(relevant)
		onAnswerChange?.(relevant)
	}, [])

	const optionsAtATime = useMemo(() => {
		const val = parseInt(data.optionsAtATime as string)
		return isNaN(val) || val <= 0 ? 1 : val
	}, [data.optionsAtATime])

	const optionUsageCount = useMemo(() => {
		const count: Record<string, number> = {}
		Object.values(localAnswers).forEach(answer => {
			if (answer) {
				count[answer] = (count[answer] || 0) + 1
			}
		})
		return count
	}, [localAnswers])

	const visibleOptions = useMemo(() => {
		return data.options.filter(option => {
			const variant = option.variant || option.label
			const used = optionUsageCount[variant] || 0
			return used < optionsAtATime
		})
	}, [data.options, optionUsageCount, optionsAtATime])

	const handleDrop = (number: string, item: DragItem) => {
		setLocalAnswers(prev => {
			const newAnswers = { ...prev }
			if (newAnswers[number] === item.variant) return prev

			// Enforce optionsAtATime
			if (optionsAtATime <= 1) {
				for (const key in newAnswers) {
					if (newAnswers[key] === item.variant) {
						delete newAnswers[key]
					}
				}
			} else {
				const usage = Object.values(newAnswers).filter(v => v === item.variant).length
				if (usage >= optionsAtATime) return prev
			}

			newAnswers[number] = item.variant
			onAnswerChange(newAnswers)
			return newAnswers
		})
	}

	const removeAnswer = (number: string) => {
		setLocalAnswers(prev => {
			const updated = { ...prev }
			delete updated[number]
			onAnswerChange(updated)
			return updated
		})

		// Remove from localStorage after state update to avoid React warning
		// Also add null check for currentSection
		if (currentSection) {
			setTimeout(() => {
				QuestionHandlers.removeAnswer(currentSection, number)
			}, 0)
		}
	}

	return (
		<DndProvider backend={HTML5Backend}>
			<Label className='text-sm mb-1'>
				<div className='text-sm text-muted-foreground mb-4'>
					Question {data.questionStart}–{data.questionEnd}
				</div>
				<div className='instructions space-y-2 mb-4'>
					{data.instructions?.map((line, idx) => (
						<StableHtml key={idx} as='div' html={processTextWithBoldAndCaps(line)} />
					))}
				</div>
			</Label>

		{/* Headline */}
			{data.headline && (
				<div className='text-center w-full flex items-center justify-center mb-4'>
					<StableHtml as='p' className='font-bold' html={processTextWithBoldAndCaps(data.headline)} />
				</div>
			)}

		<div className='wrapper flex gap-4 items-start justify-between'>
				<div className='space-y-4 w-[65%]'>
					{data.pairs.map(pair => (
						<DropTarget
							key={pair.number}
							number={pair.number}
							item={pair.item}
							answer={localAnswers[pair.number]}
							answerText={
								localAnswers[pair.number]
									? `${localAnswers[pair.number]}. ${
											variantToText[localAnswers[pair.number]] || ''
									  }`
									: ''
							}
							onDrop={handleDrop}
							onRemove={removeAnswer}
						/>
					))}
				</div>
				<div className='mb-4 flex flex-col flex-wrap gap-2'>
					{visibleOptions.length > 0 ? (
						visibleOptions.map(opt => {
							const variant = opt.variant || opt.label
							return (
								<DraggableOption
									key={variant}
									variant={variant}
									text={opt.text}
									used={(optionUsageCount[variant] || 0) > 0}
								/>
							)
						})
					) : (
						<span className='text-sm text-muted-foreground italic'>
							All options at capacity. Very popular bunch, aren’t they?
						</span>
					)}
				</div>
			</div>
		</DndProvider>
	)
}

function DraggableOption({
	variant,
	text,
	used,
}: {
	variant: string
	text: string
	used: boolean
}) {
	const [, drag] = useDrag({
		type: 'option',
		item: { variant },
	})
		return (
			<div
				ref={drag as unknown as Ref<HTMLDivElement>}
				className={`cursor-move border p-2 rounded bg-white shadow-sm ${used ? 'line-through' : ''}`}
			>
				<StableHtml as='span' html={processTextWithBoldAndCaps(`${variant}. ${text}`)} />
			</div>
		)
	}

function DropTarget({
	number,
	item,
	answer,
	answerText,
	onDrop,
	onRemove,
}: {
	number: string
	item: string
	answer?: string
	answerText?: string
	onDrop: (number: string, item: DragItem) => void
	onRemove: (number: string) => void
}) {
	const [{ isOver, canDrop }, drop] = useDrop({
		accept: 'option',
		drop: (item: DragItem) => onDrop(number, item),
		collect: monitor => ({
			isOver: monitor.isOver(),
			canDrop: monitor.canDrop(),
		}),
	})

	return (
		<div
			ref={drop as unknown as Ref<HTMLDivElement>}
			id={`qn-${number}`}
			className={cn(
				'border-2 transition-colors',
				isOver && canDrop ? 'border-blue-500' : 'border-muted',
				answer && 'border-gray-500'
			)}
		>
			<div className='p-4'>
				<div className='flex justify-between items-center'>
					<div className='font-semibold text-muted-foreground'>{number}</div>
					<div className='text-sm flex items-center gap-2'>
						{answer ? (
							<>
								<span className='text-sm text-blue-600 font-medium'>{answerText || answer}</span>
								<button
									type='button'
									onClick={() => onRemove(number)}
									className='text-xs text-red-500 hover:underline'
								>
									Remove
								</button>
							</>
						) : (
							'—'
						)}
					</div>
				</div>
					<StableHtml as='div' className='mt-2 text-sm' html={processTextWithBoldAndCaps(item)} />
				</div>
			</div>
		)
}
