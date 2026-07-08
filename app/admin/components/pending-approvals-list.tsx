import Link from 'next/link'
import { ArrowRight, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PendingApproval } from '../dashboard-types'

interface PendingApprovalsListProps {
	approvals: PendingApproval[]
}

export function PendingApprovalsList({ approvals }: PendingApprovalsListProps) {
	return (
		<Card className='rounded-lg border bg-card shadow-xs'>
			<CardHeader>
				<CardTitle className='font-heading text-lg'>Pending approvals</CardTitle>
				<CardDescription>Latest students waiting for exam access.</CardDescription>
			</CardHeader>
			<CardContent>
				{approvals.length === 0 ? (
					<div className='flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed bg-muted/40 p-6 text-center'>
						<CheckSquare className='mb-2 size-5 text-muted-foreground' />
						<p className='text-sm font-medium'>No pending approvals</p>
						<p className='mt-1 text-xs text-muted-foreground'>New exam entry requests will appear here.</p>
					</div>
				) : (
					<div className='space-y-3'>
						{approvals.map(approval => (
							<div key={approval.id} className='rounded-md border bg-background p-3'>
								<p className='truncate text-sm font-medium text-foreground'>
									{approval.users?.full_name || approval.user_id}
								</p>
								<p className='truncate text-xs text-muted-foreground'>{approval.users?.email || approval.user_id}</p>
							</div>
						))}
					</div>
				)}
				<Button asChild variant='outline' className='mt-4 w-full justify-between'>
					<Link href='/admin/approvals'>
						Review approvals
						<ArrowRight className='size-4' />
					</Link>
				</Button>
			</CardContent>
		</Card>
	)
}
