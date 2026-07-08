'use client'

import { PageTransition } from '@/components/ui/page-transition'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchCurrentUser, getAuthToken, getAuthUser, logoutAuthSession } from '@/lib/authClient'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StudentSidebar } from './sidebar'

function StudentShellSkeleton() {
	return (
		<div className='flex min-h-screen bg-background'>
			<aside className='hidden w-64 border-r bg-sidebar md:block'>
				<div className='space-y-4 p-4'>
					<Skeleton className='h-12 w-full' />
					<Skeleton className='h-8 w-full' />
					<Skeleton className='h-8 w-full' />
				</div>
			</aside>
			<main className='flex-1 p-6'>
				<Skeleton className='h-8 w-48' />
				<Skeleton className='mt-6 h-64 w-full' />
			</main>
		</div>
	)
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
	const [isLoading, setIsLoading] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const router = useRouter()
	const pathname = usePathname()
	const isPublicStudentRoute = pathname === '/student/login'

	useEffect(() => {
		if (isPublicStudentRoute) {
			return
		}

		const user = getAuthUser()
		if (!getAuthToken() || user?.role !== 'student') {
			router.replace('/student/login')
			setIsLoading(false)
			return
		}

		void fetchCurrentUser()
			.then(freshUser => {
				if (freshUser.role !== 'student') {
					logoutAuthSession()
					router.replace('/student/login')
					return
				}
				setIsAuthenticated(true)
			})
			.catch(() => {
				logoutAuthSession()
				router.replace('/student/login')
			})
			.finally(() => setIsLoading(false))
	}, [isPublicStudentRoute, router])

	if (isPublicStudentRoute) return <>{children}</>

	if (isLoading) return <StudentShellSkeleton />
	if (!isAuthenticated) return null

	return (
		<SidebarProvider defaultOpen>
			<StudentSidebar />
			<SidebarInset className='min-h-screen bg-background'>
				<header className='sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='h-5' />
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Student Panel</p>
						<h1 className='font-heading text-lg font-semibold leading-none text-foreground'>Dashboard</h1>
					</div>
				</header>
				<main className='mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8'>
					<PageTransition>{children}</PageTransition>
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
