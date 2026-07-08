'use client'

import { ExamSectionGate } from '@/components/exam/ExamSectionGate'
import ReadingSection from '@/components/exam/ReadingSection'

export default function ReadingExamPage() {
	return (
		<ExamSectionGate
			section='Reading'
			render={({ userId, test, onComplete }) => (
				<ReadingSection userId={userId} test={test} onComplete={onComplete} />
			)}
		/>
	)
}
