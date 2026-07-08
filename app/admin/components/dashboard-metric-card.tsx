import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardMetricCardProps {
	title: string
	value: number
	description: string
	icon: LucideIcon
}

export function DashboardMetricCard({ title, value, description, icon: Icon }: DashboardMetricCardProps) {
	return (
		<Card className='rounded-lg border bg-card shadow-xs'>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
				<CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
				<Icon className='size-4 text-muted-foreground' />
			</CardHeader>
			<CardContent>
				<div className='text-2xl font-semibold text-foreground'>{value.toLocaleString()}</div>
				<p className='mt-1 text-xs text-muted-foreground'>{description}</p>
			</CardContent>
		</Card>
	)
}
