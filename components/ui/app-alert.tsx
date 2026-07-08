import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

type AppAlertTone = 'info' | 'success' | 'warning' | 'error'

const toneMeta = {
	info: {
		icon: Info,
		className: 'border-[var(--info-border)] bg-[var(--info-subtle)] text-[var(--info)]',
	},
	success: {
		icon: CheckCircle2,
		className: 'border-[var(--success-border)] bg-[var(--success-subtle)] text-[var(--success)]',
	},
	warning: {
		icon: TriangleAlert,
		className: 'border-[var(--warning-border)] bg-[var(--warning-subtle)] text-[var(--warning)]',
	},
	error: {
		icon: AlertCircle,
		className: 'border-[var(--danger-border)] bg-[var(--danger-subtle)] text-[var(--danger)]',
	},
}

type AppAlertProps = {
	tone?: AppAlertTone
	title?: string
	children: ReactNode
	className?: string
}

export function AppAlert({ tone = 'info', title, children, className }: AppAlertProps) {
	const meta = toneMeta[tone]
	const Icon = meta.icon

	return (
		<Alert className={cn(meta.className, className)}>
			<Icon className='size-4' />
			{title && <AlertTitle>{title}</AlertTitle>}
			<AlertDescription className='text-current/90'>{children}</AlertDescription>
		</Alert>
	)
}
