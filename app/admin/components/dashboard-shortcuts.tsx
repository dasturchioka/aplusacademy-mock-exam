import Link from 'next/link'
import { FilePlus2, ListChecks, Plus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const shortcuts = [
	{ label: 'Approve requests', href: '/admin/approvals', icon: ListChecks },
	{ label: 'Create test', href: '/admin/tests/create-test-dynamic', icon: FilePlus2 },
	{ label: 'Add user', href: '/admin/users', icon: UserPlus },
	{ label: 'View results', href: '/admin/results', icon: Plus },
]

export function DashboardShortcuts() {
	return (
		<Card className='rounded-lg border bg-card shadow-xs'>
			<CardHeader>
				<CardTitle className='font-heading text-lg'>Shortcuts</CardTitle>
			</CardHeader>
			<CardContent className='grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
				{shortcuts.map(item => (
					<Button key={item.href} asChild variant='outline' className='justify-start gap-2'>
						<Link href={item.href}>
							<item.icon className='size-4' />
							{item.label}
						</Link>
					</Button>
				))}
			</CardContent>
		</Card>
	)
}
