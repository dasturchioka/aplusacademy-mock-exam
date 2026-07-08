'use client'

import { ExamSectionGate } from '@/components/exam/ExamSectionGate'
import WritingSection from '@/components/exam/WritingSection'

export default function WritingExamPage() {
	return (
		<ExamSectionGate
			section='Writing'
			onComplete={() => {
				sessionStorage.setItem('ielts_exam_completion_ready', 'true')
			}}
			render={({ userId, test, onComplete }) => (
				<WritingSection userId={userId} test={test} onComplete={onComplete} />
			)}
		/>
	)
}
