'use client'
import { useCurrentExamSection } from '@/hooks/useCurrentExamSection'
import { useScrollAndFocus } from '@/hooks/useScrollAndFocus'
import { STORAGE_KEYS } from '@/lib/answerHandlers'
import { useEffect, useState } from 'react'

interface PartIndicatorProps {
	questionStart: number
	questionEnd: number
	section: 'Listening' | 'Reading'
	className?: string
}

export function PartIndicator({
	questionStart,
	questionEnd,
	section,
	className = '',
}: PartIndicatorProps) {
	const scrollAndFocus = useScrollAndFocus()
	const currentSection = useCurrentExamSection()

	const [answersInStorageParsed, setAnswersInStorageParsed] = useState({})

	useEffect(() => {
		const updateAnswers = () => {
			const answers =
				currentSection === 'Listening'
					? sessionStorage.getItem(STORAGE_KEYS.LISTENING_ANSWERS)
					: sessionStorage.getItem(STORAGE_KEYS.READING_ANSWERS)

			const parsed = JSON.parse(answers ?? '{}')

			// ✅ Prevent unnecessary updates
			setAnswersInStorageParsed(prev => {
				if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
					return parsed
				}
				return prev
			})
		}

		window.addEventListener('answersUpdated', updateAnswers)
		updateAnswers()

		return () => {
			window.removeEventListener('answersUpdated', updateAnswers)
		}
	}, [currentSection])

	return (
		<div className={`questions ml-2 flex flex-wrap gap-1 ${className}`}>
			{Array.from({ length: questionEnd - questionStart + 1 }).map((_, idx) => {
				const questionNumber = questionStart + idx

				const answerInStorage = answersInStorageParsed[String(questionNumber)]

				return (
					<span
						key={questionNumber}
						onClick={() => scrollAndFocus(questionNumber)}
						className={`cursor-pointer p-1 rounded bg-gray-100 hover:bg-gray-200
              transition text-xs border-t-4 min-w-[28px] text-center
              ${answerInStorage ? 'border-t-green-600' : 'border-t-gray-200'}`}
						role='button'
						tabIndex={questionNumber}
					>
						{questionNumber}
					</span>
				)
			})}
		</div>
	)
}
