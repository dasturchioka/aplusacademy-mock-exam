'use client'

import { Label } from '@/components/ui/label'
import { useQuestionNumbersStore } from '@/lib/stores/answeredQuestionsStore'
import { useEffect, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { STORAGE_KEYS } from '@/lib/answerHandlers'
import { useCurrentExamSection } from '@/hooks/useCurrentExamSection'
import { processTextWithBoldAndCaps } from '@/utils/highlightAsBold'

type Option = {
	variant: string
	text: string
}

type Question = {
	number: number
	paragraph: string
	answer: string
}

type QuestionBlock = {
	questionId: string
	type: 'match-heading'
	instructions: string[]
	options: Option[]
	questions: Question[]
	questionStart: number
	questionEnd: number
	optionsAtATime?: number
	headline?:string
}

type Props = {
	question: QuestionBlock
	onAnswerChange: (answers: Array<{ number: number; answer: string }>) => void
	currentAnswers?: Array<{ number: number; answer: string }>
}

const ItemTypes = {
	HEADING: 'heading',
}

export { ItemTypes }

type DragItem = {
	variant: string
	from: 'pool' | 'paragraph'
	paragraphNumber?: number
}

export default function InlineMatchHeading({
	question,
	onAnswerChange,
	currentAnswers = [],
}: Props) {
	const currentSection = useCurrentExamSection()
	const pushNumber = useQuestionNumbersStore(state => state.pushNumber)

	// Guard against undefined question or options
	if (!question || !question.options || !Array.isArray(question.options)) {
		console.warn('InlineMatchHeading: Invalid question data:', question)
		return (
			<div className='space-y-6'>
				<div className='text-red-500 text-sm'>⚠️ Match heading question data is not available</div>
			</div>
		)
	}

	// For match-heading, we don't have a questions array - the questions are defined by paragraphs
	// We just need to manage the available options and show instructions
	const [userAnswers, setUserAnswers] =
		useState<Array<{ number: number; answer: string }>>(currentAnswers)

	// Sync with parent answers
	useEffect(() => {
		const range = (start: number, end: number): number[] =>
			Array.from({ length: end - start + 1 }, (_, i) => start + i)

		const start = +question.questionStart
		const end = +question.questionEnd
		const numbers = range(start, end)

		for (let i = 0; i < numbers.length; i++) {
			pushNumber(numbers[i])
		}

		// ✅ Load answers from localStorage based on current section
		const storedAnswersRaw =
			sessionStorage.getItem(
				currentSection === 'Listening'
					? STORAGE_KEYS.LISTENING_ANSWERS
					: STORAGE_KEYS.READING_ANSWERS
			) || '{}'

		const storedAnswers = JSON.parse(storedAnswersRaw) as Record<string, string>

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
			setUserAnswers(loadedAnswers)
			onAnswerChange(loadedAnswers)
		}
	}, [])

	// Sync with prop changes
	useEffect(() => {
		setUserAnswers(currentAnswers)
	}, [currentAnswers])

	const usedVariants = userAnswers.map(ans => ans.answer).filter(Boolean)
	const availableOptions = question.options.filter(opt => !usedVariants.includes(opt.variant))

	// ✅ Apply optionsAtATime limit
	const visibleOptions = question.optionsAtATime
		? availableOptions.slice(0, question.optionsAtATime)
		: availableOptions

	const DraggableOption = ({
		option,
		from,
		paragraphNumber,
	}: {
		option: Option
		from: 'pool' | 'paragraph'
		paragraphNumber?: number
	}) => {
		const [{ isDragging }, drag] = useDrag(() => ({
			type: ItemTypes.HEADING,
			item: { variant: option.variant, from, paragraphNumber },
			collect: monitor => ({
				isDragging: monitor.isDragging(),
			}),
		}))

		return (
		<div
			ref={drag as any}
			className={`cursor-move border p-2 rounded bg-white shadow-sm ${
				isDragging ? 'opacity-50' : ''
			} ${from === 'paragraph' ? 'min-w-[80px] text-center' : ''}`}
		>
			<strong>{option.variant}</strong>
			{from === 'pool' ? <span dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(` - ${option.text}`) }} /> : ''}
		</div>
	)
}

	return (
		<DndProvider backend={HTML5Backend}>
			<div className='space-y-6'>
			{/* Instructions */}
			<div className='space-y-1'>
				{question.instructions?.map((inst, i) => (
					<p key={i} className='text-muted-foreground text-sm' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(inst) }} />
				)) || (
					<p className='text-muted-foreground text-sm'>
						Choose the correct heading for each paragraph from the list below.
					</p>
				)}
			</div>

			{/* Headline */}
			{question.headline && (
				<div className='text-center w-full flex items-center justify-center my-4'>
					<p className='font-bold' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(question.headline) }} />
				</div>
			)}

				{/* Available headings pool */}
				<div className='space-y-2'>
					<Label className='text-base'>Available Headings</Label>
					<div className='flex flex-wrap gap-2'>
						{visibleOptions.map((opt, i) => (
							<DraggableOption key={i} option={opt} from='pool' />
						))}
					</div>
					{visibleOptions.length === 0 && (
						<p className='text-sm text-gray-500'>All headings have been used or hidden.</p>
					)}
				</div>
			</div>
		</DndProvider>
	)
}

// Separate component for paragraph drop zones that can be used in ReadingSection
export function ParagraphDropZone({
	questionNumber,
	question,
	userAnswers,
	onAnswerChange,
	onSwapAnswers,
	onRemoveAnswer,
}: {
	questionNumber: number
	question: QuestionBlock
	userAnswers: Array<{ number: number; answer: string }>
	onAnswerChange: (questionNumber: number, headingVariant: string) => void
	onSwapAnswers: (source: number, target: number) => void
	onRemoveAnswer: (questionNumber: number) => void
}) {
	// Guard against invalid data
	if (!question || !question.options || !Array.isArray(question.options)) {
		console.warn('ParagraphDropZone: Invalid question data for question', questionNumber)
		return (
			<div className='mb-3 p-2 bg-red-50 border border-red-200 rounded'>
				<span className='text-xs text-red-600'>Question {questionNumber}: Invalid data</span>
			</div>
		)
	}

	if (!userAnswers || !Array.isArray(userAnswers)) {
		console.warn('ParagraphDropZone: Invalid userAnswers for question', questionNumber)
		return (
			<div className='mb-3 p-2 bg-white border rounded'>
				<span className='text-xs text-yellow-600'>Question {questionNumber}: Loading...</span>
			</div>
		)
	}

	const currentAnswer = userAnswers.find(ans => ans.number === questionNumber)?.answer || ''
	const currentOption = question.options.find(opt => opt.variant === currentAnswer)

	const [, drop] = useDrop(
		() => ({
			accept: ItemTypes.HEADING,
			drop: (item: DragItem) => {
				if (item.from === 'pool') {
					// Dropping from pool to paragraph
					onAnswerChange(questionNumber, item.variant)
				} else if (item.paragraphNumber !== undefined && item.paragraphNumber !== questionNumber) {
					// Swapping between paragraphs
					onSwapAnswers(item.paragraphNumber, questionNumber)
				} else if (item.paragraphNumber === questionNumber) {
					// Dropping back to same position, do nothing
					return
				}
			},
		}),
		[userAnswers, questionNumber]
	)

	const DraggableOption = ({ option }: { option: Option }) => {
		const [{ isDragging }, drag] = useDrag(() => ({
			type: ItemTypes.HEADING,
			item: { variant: option.variant, from: 'paragraph', paragraphNumber: questionNumber },
			collect: monitor => ({
				isDragging: monitor.isDragging(),
			}),
		}))

		return (
		<div
			ref={drag as any}
			className={`cursor-move border rounded px-2 bg-blue-50 shadow-sm min-w-[80px] text-center ${
				isDragging ? 'opacity-50' : ''
			}`}
		>
			<strong dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(`${option.variant}. ${option.text}`) }} />
		</div>
	)
	}

	// Pool drop zone for returning headings
	const PoolDropZone = () => {
		const [, poolDrop] = useDrop(
			() => ({
				accept: ItemTypes.HEADING,
				drop: (item: DragItem) => {
					if (item.from === 'paragraph' && item.paragraphNumber !== undefined) {
						onRemoveAnswer(item.paragraphNumber)
					}
				},
			}),
			[userAnswers]
		)

		return (
			<div
				ref={poolDrop as any}
				className='min-h-[40px] border border-dashed border-gray-300 p-2 rounded bg-gray-50 flex items-center justify-center text-xs text-gray-500'
			>
				Drag here to remove
			</div>
		)
	}

	return (
		<div className='mb-3 bg-white border rounded'>
			<div className='flex items-center justify-start gap-2'>
				<div className='flex items-center gap-2 w-full'>
					<div
						id={`qn-${questionNumber}`}
						style={{ width: !currentOption ? '100%' : '' }}
						ref={drop as any}
						className={`min-h-[40px] min-w-[120px] p-2 flex items-center justify-center ${
							!currentOption ? 'w-full' : ''
						}`}
					>
						{currentOption ? (
							<DraggableOption option={currentOption} />
						) : (
							<span className='text-blue-600 text-lg'>{questionNumber}</span>
						)}
					</div>
					{currentOption && <PoolDropZone />}
				</div>
			</div>
		</div>
	)
}
