'use client'

import * as React from 'react'
import {
	BookOpen,
	CheckSquare,
	ChevronRight,
	Grid2X2Plus,
	ListTodo,
	LoaderCircle,
	LogOut,
	Settings,
	Shield,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail,
} from '@/components/ui/sidebar'
import { logoutAuthSession } from '@/lib/authClient'

const mainNav = [
	{ title: 'Dashboard', url: '/admin', icon: Grid2X2Plus },
	{ title: 'Users', url: '/admin/users', icon: Users },
	{
		title: 'Tests',
		url: '/admin/tests',
		icon: BookOpen,
		items: [
			{ title: 'See tests', url: '/admin/tests' },
			{ title: 'Create test', url: '/admin/tests/create-test-dynamic' },
		],
	},
	{ title: 'Approvals', url: '/admin/approvals', icon: CheckSquare },
	{ title: 'Results', url: '/admin/results', icon: ListTodo },
]

const systemNav = [{ title: 'Developer Settings', url: '/admin/developer-settings', icon: Settings }]

function isNavActive(pathname: string, url: string) {
	if (url === '/admin') return pathname === '/admin'
	return pathname === url || pathname.startsWith(`${url}/`)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const router = useRouter()
	const pathname = usePathname()
	const [isLoggingOut, setIsLoggingOut] = React.useState(false)
	const isTestsActive = isNavActive(pathname ?? '', '/admin/tests')
	const [isTestsOpen, setIsTestsOpen] = React.useState(isTestsActive)

	React.useEffect(() => {
		if (isTestsActive) {
			setIsTestsOpen(true)
		}
	}, [isTestsActive, pathname])

	const handleLogout = () => {
		setIsLoggingOut(true)
		logoutAuthSession()
		router.replace('/auth/admin')
	}

	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader className='border-b'>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size='lg' asChild>
							<Link href='/admin'>
								<div className='flex aspect-square size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground'>
									<Shield className='size-4' />
								</div>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-heading font-semibold'>Mock Exam</span>
									<span className='truncate text-xs text-muted-foreground'>Aplus Academy</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Platform</SidebarGroupLabel>
					<SidebarMenu>
						{mainNav.map(item => {
							const active = isNavActive(pathname ?? '', item.url)

							if (item.items?.length) {
								return (
									<Collapsible
										key={item.title}
										asChild
										open={isTestsOpen}
										onOpenChange={setIsTestsOpen}
										className='group/collapsible'
									>
										<SidebarMenuItem>
											<CollapsibleTrigger asChild>
												<SidebarMenuButton tooltip={item.title} isActive={active}>
													<item.icon />
													<span>{item.title}</span>
													<ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
												</SidebarMenuButton>
											</CollapsibleTrigger>
											<CollapsibleContent>
												<SidebarMenuSub>
													{item.items.map(subItem => (
														<SidebarMenuSubItem key={subItem.title}>
															<SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
																<Link href={subItem.url}>{subItem.title}</Link>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													))}
												</SidebarMenuSub>
											</CollapsibleContent>
										</SidebarMenuItem>
									</Collapsible>
								)
							}

							return (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild tooltip={item.title} isActive={active}>
										<Link href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)
						})}
					</SidebarMenu>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>System</SidebarGroupLabel>
					<SidebarMenu>
						{systemNav.map(item => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild tooltip={item.title} isActive={isNavActive(pathname ?? '', item.url)}>
									<Link href={item.url}>
										<item.icon />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className='border-t p-3'>
				<Button disabled={isLoggingOut} onClick={handleLogout} variant='outline' className='w-full justify-start gap-2'>
					{isLoggingOut ? <LoaderCircle className='size-4 animate-spin' /> : <LogOut className='size-4' />}
					<span>{isLoggingOut ? 'Logging out' : 'Log out'}</span>
				</Button>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
