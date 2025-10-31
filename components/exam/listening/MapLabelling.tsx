'use client'
import { MapLabellingQuestionBlock } from '@/components/admin/listening/MapLabelling'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useCurrentExamSection } from '@/hooks/useCurrentExamSection'
import { STORAGE_KEYS } from '@/lib/answerHandlers'
import { processTextWithBoldAndCaps } from '@/utils/highlightAsBold'

interface MapLabellingExamProps {
	questionBlock: MapLabellingQuestionBlock
	onAnswer: (answers: { [key: string]: string }[]) => void
	answer?: any
	onAnswerChange?: (answers: { [key: string]: string }[]) => void
}

export const MapLabellingExam: React.FC<MapLabellingExamProps> = ({
	questionBlock,
	onAnswer,
	answer,
	onAnswerChange,
}) => {
	const currentSection = useCurrentExamSection()
	const [answers, setAnswers] = useState<Record<string, string>>({})
	const [isZoomed, setIsZoomed] = useState(false)
	const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
	const imageContainerRef = useRef<HTMLDivElement>(null)

	const validQuestions =
		questionBlock.questions?.filter(q => q && (q.number || q.questionNumber)) || []

	useEffect(() => {
		const key =
			currentSection === 'Listening' ? STORAGE_KEYS.LISTENING_ANSWERS : STORAGE_KEYS.READING_ANSWERS

		const stored = sessionStorage.getItem(key)
		const parsed: Record<string, string> = stored ? JSON.parse(stored) : {}

		const initial: Record<string, string> = {}
		for (const q of validQuestions) {
			const number = q.number || q.questionNumber?.toString()
			if (number && parsed[number]) {
				initial[number] = parsed[number]
			}
		}

		setAnswers(prev => ({
			...initial,
			...prev, // prefer explicitly passed answers
		}))
	}, [currentSection, questionBlock])

	useEffect(() => {
		if (answer && typeof answer === 'object') {
			setAnswers(prev => ({
				...prev,
				...answer,
			}))
		}
	}, [answer])

	const toArrayFormat = (obj: Record<string, string>) =>
		Object.entries(obj).map(([key, value]) => ({
			number: parseInt(key),
			answer: value,
		}))

	const handleCellClick = (questionNum: string, label: string) => {
		const newAnswers = { ...answers }

		// Toggle answer
		if (newAnswers[questionNum] === label) {
			delete newAnswers[questionNum]
		} else {
			newAnswers[questionNum] = label
		}

		setAnswers(newAnswers)

		const arrayFormat = toArrayFormat(newAnswers)
		onAnswer?.(arrayFormat)
		onAnswerChange?.(arrayFormat)
	}

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isZoomed || !imageContainerRef.current) return

		const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect()
		const x = ((e.clientX - left) / width) * 100
		const y = ((e.clientY - top) / height) * 100

		setZoomPosition({ x, y })
	}

	const toggleZoom = () => setIsZoomed(prev => !prev)

	return (
		<Card className='p-4 space-y-4'>
			<Label className='text-sm'>
				<div className='text-sm text-muted-foreground mb-4'>
					Question {questionBlock.questionStart}–{questionBlock.questionEnd}
				</div>
				<div className='instructions space-y-2 mb-8'>
					{questionBlock.instructions?.map((line, idx) => (
						<div key={idx} dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(line) }} />
					))}
				</div>
			</Label>

			{/* Headline */}
			{questionBlock.headline && (
				<div className='text-center w-full flex items-center justify-center mb-4'>
					<p className='font-bold' dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(questionBlock.headline) }} />
				</div>
			)}

			<CardHeader>
				<CardTitle className='text-center'>
					<span dangerouslySetInnerHTML={{ __html: processTextWithBoldAndCaps(questionBlock.image?.headline || 'Map Exercise') }} />
				</CardTitle>
			</CardHeader>

			<CardContent>
				{questionBlock.image?.url && (
					<div
						ref={imageContainerRef}
						onClick={toggleZoom}
						onMouseMove={handleMouseMove}
						className={`relative w-full max-w-md mx-auto mb-4 border rounded overflow-hidden cursor-${
							isZoomed ? 'zoom-out' : 'zoom-in'
						}`}
					>
						<img
							src={questionBlock.image.url}
							alt='Map'
							className={`transition-transform duration-200 ease-in-out w-full h-auto ${
								isZoomed ? 'scale-[2] origin-top-left' : 'scale-100 origin-center'
							}`}
							style={
								isZoomed
									? {
											transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
											cursor: 'zoom-in',
									  }
									: {}
							}
						/>
					</div>
				)}

				{/* Table of questions and labels */}
				<div className='overflow-x-auto'>
					<table className='w-full border-collapse border border-gray-300'>
						<thead>
							<tr>
								<th className='border border-gray-300 p-3 bg-gray-50 text-left font-semibold'>
									Questions
								</th>
								{questionBlock.labels.map((label, index) => (
									<th
										key={`label-header-${label}-${index}`}
										className='border border-gray-300 p-3 bg-gray-50 text-center font-semibold min-w-[60px]'
									>
										{label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{validQuestions.map((question, questionIndex) => {
								const questionNum =
									question.number ||
									question.questionNumber?.toString() ||
									(questionIndex + 1).toString()

								const selectedLabel = answers[questionNum]

								return (
									<tr key={`question-row-${questionNum}-${questionIndex}`}>
										<th className='border border-gray-300 p-3 bg-gray-50 text-left font-medium'>
											<div id={`qn-${questionNum}`}>
												<strong className='mr-2'>{questionNum}.</strong>
												{question.text?.replace('____', '') || `Question ${questionNum}`}
											</div>
										</th>
										{questionBlock.labels.map((label, labelIndex) => {
											const isSelected = selectedLabel === label

											return (
												<td
													key={`cell-${questionNum}-${label}-${labelIndex}`}
													className={`border border-gray-300 p-3 text-center cursor-pointer transition-colors hover:bg-gray-100 ${
														isSelected ? 'bg-green-100' : 'bg-white'
													}`}
													onClick={() => handleCellClick(questionNum, label)}
												>
													{isSelected && <Check className='w-5 h-5 mx-auto text-green-600' />}
												</td>
											)
										})}
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	)
}
