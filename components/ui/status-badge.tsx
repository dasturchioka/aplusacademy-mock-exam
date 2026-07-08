import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getStatusMeta, type ProductStatus } from '@/lib/ui-status'

const toneClasses = {
	success: 'border-[var(--success-border)] bg-[var(--success-subtle)] text-[var(--success)]',
	warning: 'border-[var(--warning-border)] bg-[var(--warning-subtle)] text-[var(--warning)]',
	danger: 'border-[var(--danger-border)] bg-[var(--danger-subtle)] text-[var(--danger)]',
	info: 'border-[var(--info-border)] bg-[var(--info-subtle)] text-[var(--info)]',
	neutral: 'border-border bg-muted text-muted-foreground',
}

type StatusBadgeProps = {
	status: ProductStatus | string
	label?: string
	className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
	const meta = getStatusMeta(status)
	const Icon = meta.icon

	return (
		<Badge
			variant='outline'
			className={cn('gap-1.5 rounded-md px-2 py-0.5 font-medium', toneClasses[meta.tone], className)}
		>
			<Icon className={cn('size-3.5', meta.spin && 'animate-spin')} />
			{label ?? meta.label}
		</Badge>
	)
}
