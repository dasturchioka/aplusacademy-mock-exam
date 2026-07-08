import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileCheck2,
	Info,
	Loader2,
	Lock,
	Unlock,
	XCircle,
	type LucideIcon,
} from 'lucide-react'

export type ProductStatus =
	| 'active'
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'saved'
	| 'saving'
	| 'retrying'
	| 'failed'
	| 'completed'
	| 'abandoned'
	| 'published'
	| 'unpublished'
	| 'analysis-published'
	| 'locked'
	| 'draft'
	| 'info'
	| 'neutral'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export type StatusMeta = {
	label: string
	tone: StatusTone
	icon: LucideIcon
	spin?: boolean
}

const statusMap: Record<ProductStatus, StatusMeta> = {
	active: { label: 'Active', tone: 'info', icon: Unlock },
	pending: { label: 'Pending', tone: 'warning', icon: Clock },
	approved: { label: 'Approved', tone: 'success', icon: CheckCircle2 },
	rejected: { label: 'Rejected', tone: 'danger', icon: XCircle },
	saved: { label: 'Saved', tone: 'success', icon: CheckCircle2 },
	saving: { label: 'Saving...', tone: 'info', icon: Loader2, spin: true },
	retrying: { label: 'Retrying...', tone: 'warning', icon: Loader2, spin: true },
	failed: { label: 'Failed', tone: 'danger', icon: AlertCircle },
	completed: { label: 'Completed', tone: 'success', icon: FileCheck2 },
	abandoned: { label: 'Abandoned', tone: 'danger', icon: XCircle },
	published: { label: 'Published', tone: 'success', icon: CheckCircle2 },
	unpublished: { label: 'Unpublished', tone: 'neutral', icon: Lock },
	'analysis-published': { label: 'Analysis published', tone: 'success', icon: CheckCircle2 },
	locked: { label: 'Locked', tone: 'neutral', icon: Lock },
	draft: { label: 'Draft', tone: 'neutral', icon: FileCheck2 },
	info: { label: 'Info', tone: 'info', icon: Info },
	neutral: { label: 'Neutral', tone: 'neutral', icon: Info },
}

export function getStatusMeta(status: ProductStatus | string): StatusMeta {
	return statusMap[status as ProductStatus] ?? {
		label: String(status || 'Unknown'),
		tone: 'neutral',
		icon: Info,
	}
}
