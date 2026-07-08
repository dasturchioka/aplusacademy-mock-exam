import { AppAlert } from '@/components/ui/app-alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AlertTriangle, FileText, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

type PageStateProps = {
	type: 'loading' | 'empty' | 'error' | 'blocked'
	title: string
	description?: string
	action?: ReactNode
	className?: string
}

export function PageState({ type, title, description, action, className }: PageStateProps) {
	if (type === 'loading') {
		return (
			<div className={cn('space-y-4 rounded-lg border bg-card p-5', className)}>
				<div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
					<Loader2 className='size-4 animate-spin' />
					{title}
				</div>
				<Skeleton className='h-10 w-full max-w-sm' />
				<Skeleton className='h-28 w-full' />
			</div>
		)
	}

	const Icon = type === 'empty' ? FileText : AlertTriangle
	const tone = type === 'error' || type === 'blocked' ? 'error' : 'info'

	return (
		<AppAlert tone={tone} title={title} className={className}>
			<div className='flex flex-col gap-3'>
				{description && (
					<div className='flex items-start gap-2'>
						<Icon className='mt-0.5 size-4 shrink-0' />
						<p>{description}</p>
					</div>
				)}
				{action && <div>{action}</div>}
			</div>
		</AppAlert>
	)
}

export function RetryAction({ onRetry, label = 'Retry' }: { onRetry: () => void; label?: string }) {
	return (
		<Button type='button' variant='outline' size='sm' onClick={onRetry}>
			{label}
		</Button>
	)
}
