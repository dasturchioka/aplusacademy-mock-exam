import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
	return (
		<div className='space-y-5'>
			<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
				{[1, 2, 3, 4].map(item => (
					<Card key={item} className='rounded-lg'>
						<CardHeader className='space-y-0 pb-2'>
							<Skeleton className='h-4 w-28' />
						</CardHeader>
						<CardContent>
							<Skeleton className='h-8 w-16' />
							<Skeleton className='mt-2 h-3 w-24' />
						</CardContent>
					</Card>
				))}
			</div>
			<div className='grid gap-4 xl:grid-cols-[1fr_360px]'>
				<Card className='rounded-lg'>
					<CardHeader>
						<Skeleton className='h-5 w-40' />
						<Skeleton className='h-4 w-56' />
					</CardHeader>
					<CardContent>
						<Skeleton className='h-72 w-full' />
					</CardContent>
				</Card>
				<Card className='rounded-lg'>
					<CardHeader>
						<Skeleton className='h-5 w-36' />
					</CardHeader>
					<CardContent className='space-y-3'>
						{[1, 2, 3].map(item => (
							<Skeleton key={item} className='h-14 w-full' />
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
