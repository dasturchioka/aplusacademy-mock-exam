'use client'

import { Button } from '@/components/ui/button'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from '@/components/ui/sidebar'
import { getAuthUser, logoutAuthSession } from '@/lib/authClient'
import { ClipboardList, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
	{ title: 'Dashboard', url: '/student', icon: LayoutDashboard },
	{ title: 'Results', url: '/student/results', icon: ClipboardList },
]

export function StudentSidebar(props: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname()
	const router = useRouter()
	const user = getAuthUser()

	function handleLogout() {
		logoutAuthSession()
		router.replace('/student/login')
	}

	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader className='border-b'>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size='lg' asChild>
							<Link href='/student'>
								<div className='flex aspect-square size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground'>
									<ShieldCheck className='size-4' />
								</div>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-heading font-semibold'>Student Panel</span>
									<span className='truncate text-xs text-muted-foreground'>{user?.id || 'Aplus Academy'}</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Exam</SidebarGroupLabel>
					<SidebarMenu>
						{navItems.map(item => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
									<Link href={item.url}>
										<item.icon />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip='Current exam'>
								<Link href='/exam/start'>
									<ClipboardList />
									<span>Exam start</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className='border-t p-3'>
				<Button onClick={handleLogout} variant='destructive' className='w-full justify-start gap-2'>
					<LogOut className='size-4' />
					<span>Log out</span>
				</Button>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
