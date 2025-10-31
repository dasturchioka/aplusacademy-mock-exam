'use client'

import LogoutButton from '@/components/LogoutButton'
import { ThemeSelector } from '@/components/ThemeSelector'
import { Button } from '@/components/ui/button'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { BarChart3, CheckSquare, FileText, LayoutDashboard, Menu, Users, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppSidebar } from './sidebar'
import { Toaster } from '@/components/ui/sonner'

interface AdminLayoutProps {
	children: React.ReactNode
}

const navigation = [
	{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
	{ name: 'Users', href: '/admin/users', icon: Users },
	{ name: 'Tests', href: '/admin/tests', icon: FileText },
	{ name: 'Approvals', href: '/admin/approvals', icon: CheckSquare },
	{ name: 'Results', href: '/admin/results', icon: BarChart3 },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const router = useRouter()
	const pathname = usePathname()

	useEffect(() => {
		const checkAuth = () => {
			const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn')
			if (isLoggedIn !== 'true') {
				router.push('/auth/admin')
				return
			}
			setIsAuthenticated(true)
			setIsLoading(false)
		}

		checkAuth()
	}, [router])

	if (isLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-lg'>Loading...</div>
			</div>
		)
	}

	if (!isAuthenticated) {
		return null
	}

	return (
		<div className='min-h-screen bg-primary-foreground text-primary flex shrink-0'>
			<SidebarProvider>
				<AppSidebar />
				<main className='py-6 container mx-auto bg-primary-foreground text-primary'>
					<nav className='bg-card text-card-foreground rounded-xl py-2 px-2 mb-4 y sticky top-0 w-full flex items-center justify-between'>
						<SidebarTrigger />
					</nav>

					<div className='bg-primary-foreground text-primary'>{children}</div>
				</main>
			</SidebarProvider>
			<Toaster position='top-center' />
		</div>
	)
}
