'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { ResultDetail } from '@/lib/resultAnalysis'

type ScoreKey = 'listening' | 'reading' | 'writing' | 'speaking' | 'overall'

type Props = {
	result: ResultDetail
	mode: 'admin' | 'student'
	values?: Record<ScoreKey, string>
	onChange?: (key: ScoreKey, value: string) => void
}

const scoreItems: Array<{ key: ScoreKey; label: string }> = [
	{ key: 'listening', label: 'Listening' },
	{ key: 'reading', label: 'Reading' },
	{ key: 'writing', label: 'Writing' },
	{ key: 'speaking', label: 'Speaking' },
	{ key: 'overall', label: 'Overall' },
]

function getResultScore(result: ResultDetail, key: ScoreKey) {
	if (key === 'listening') return result.listening_score
	if (key === 'reading') return result.reading_score
	if (key === 'writing') return result.writing_score
	if (key === 'speaking') return result.speaking_score
	return result.overall_score
}

export function ResultScoreSummary({ result, mode, values, onChange }: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Scores</CardTitle>
			</CardHeader>
			<CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
				{scoreItems.map(item => (
					<div key={item.key} className='space-y-2'>
						<label className='text-sm font-medium text-muted-foreground'>{item.label}</label>
						{mode === 'admin' && values && onChange ? (
							<Input
								type='number'
								step='0.5'
								min='0'
								max='9'
								value={values[item.key]}
								onChange={event => onChange(item.key, event.target.value)}
								className={item.key === 'overall' ? 'font-bold text-blue-600' : undefined}
							/>
						) : (
							<div className={`rounded-md border bg-muted/40 px-3 py-2 ${item.key === 'overall' ? 'font-bold text-blue-700' : ''}`}>
								{getResultScore(result, item.key) ?? 'Pending'}
							</div>
						)}
					</div>
				))}
			</CardContent>
		</Card>
	)
}
