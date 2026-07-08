'use client'

import { ExamSectionGate } from '@/components/exam/ExamSectionGate'
import ListeningSection from '@/components/exam/ListeningSection'

export default function ListeningExamPage() {
	return (
		<ExamSectionGate
			section='Listening'
			render={({ userId, test, onComplete }) => (
				<ListeningSection userId={userId} test={test} onComplete={onComplete} />
			)}
		/>
	)
}
