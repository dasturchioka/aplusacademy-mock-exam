import { StatusBadge } from '@/components/ui/status-badge'

export type ExamSaveStatusValue = 'saved' | 'saving' | 'retrying' | 'failed'

type ExamSaveStatusProps = {
	status: ExamSaveStatusValue
	error?: string | null
}

export function ExamSaveStatus({ status, error }: ExamSaveStatusProps) {
	return (
		<div className='flex flex-col items-end gap-1'>
			<StatusBadge status={status} />
			{status === 'failed' && error ? (
				<p className='max-w-64 text-right text-xs text-[var(--danger)]'>{error}</p>
			) : null}
		</div>
	)
}
