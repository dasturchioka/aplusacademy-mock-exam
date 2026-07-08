'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/page-transition'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { fetchCurrentUser, getAuthToken, getAuthUser, logoutAuthSession } from '@/lib/authClient'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AppSidebar } from './sidebar'

interface AdminLayoutProps {
	children: React.ReactNode
}

const pageTitles: Record<string, string> = {
	'/admin': 'Dashboard',
	'/admin/users': 'Users',
	'/admin/tests': 'Tests',
	'/admin/tests/create-test-dynamic': 'Create Test',
	'/admin/approvals': 'Approvals',
	'/admin/results': 'Results',
	'/admin/developer-settings': 'Developer Settings',
}

function hasAdminSession() {
	const user = getAuthUser()
	return Boolean(getAuthToken() && user?.role === 'admin')
}

function AdminShellSkeleton() {
	return (
		<div className='flex min-h-screen bg-background text-foreground'>
			<aside className='hidden w-64 border-r bg-sidebar md:block'>
				<div className='space-y-4 p-4'>
					<div className='flex items-center gap-3 border-b pb-4'>
						<Skeleton className='h-9 w-9 rounded-md' />
						<div className='flex-1 space-y-2'>
							<Skeleton className='h-4 w-24' />
							<Skeleton className='h-3 w-20' />
						</div>
					</div>
					<div className='space-y-3'>
						<Skeleton className='h-3 w-16' />
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
					</div>
					<div className='space-y-3 pt-2'>
						<Skeleton className='h-3 w-14' />
						<Skeleton className='h-8 w-full' />
					</div>
				</div>
			</aside>
			<div className='flex flex-1 flex-col'>
				<header className='flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6'>
					<Skeleton className='h-8 w-8 rounded-md md:hidden' />
					<div className='hidden h-5 w-px bg-border md:block' />
					<div className='space-y-2'>
						<Skeleton className='h-3 w-24' />
						<Skeleton className='h-5 w-32' />
					</div>
				</header>
				<main className='w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8'>
					<Skeleton className='h-10 w-full max-w-sm' />
					<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
						<Skeleton className='h-32 w-full' />
						<Skeleton className='h-32 w-full' />
						<Skeleton className='h-32 w-full xl:block' />
					</div>
					<Skeleton className='h-[360px] w-full' />
				</main>
			</div>
		</div>
	)
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const router = useRouter()
	const pathname = usePathname()

	useEffect(() => {
		const authenticated = hasAdminSession()

		if (!authenticated) {
			setIsAuthenticated(false)
			setIsLoading(false)
			router.replace('/auth/admin')
			return
		}

		void fetchCurrentUser()
			.then(user => {
				if (user.role !== 'admin') {
					logoutAuthSession()
					router.replace('/auth/admin')
					return
				}
				setIsAuthenticated(true)
			})
			.catch(() => {
				logoutAuthSession()
				router.replace('/auth/admin')
			})
			.finally(() => setIsLoading(false))
	}, [router])

	const title = useMemo(() => {
		const currentPath = pathname ?? ''
		if (pageTitles[currentPath]) return pageTitles[currentPath]
		if (currentPath.startsWith('/admin/tests')) return 'Tests'
		if (currentPath.startsWith('/admin/results')) return 'Results'
		return 'Admin'
	}, [pathname])

	if (isLoading) {
		return <AdminShellSkeleton />
	}

	if (!isAuthenticated) return null

	return (
		<SidebarProvider defaultOpen>
			<AppSidebar />
			<SidebarInset className='min-h-screen bg-background'>
				<header className='sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='h-5' />
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Admin Panel</p>
						<h1 className='font-heading text-lg font-semibold leading-none text-foreground'>{title}</h1>
					</div>
				</header>
				<main className='w-full px-4 py-5 sm:px-6 lg:px-8'>
					<PageTransition>{children}</PageTransition>
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
