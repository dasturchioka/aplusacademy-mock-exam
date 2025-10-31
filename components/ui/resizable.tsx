'use client'

import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '@/lib/utils'

const ResizablePanelGroup = ({
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
	<ResizablePrimitive.PanelGroup
		className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
		{...props}
	/>
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
	withHandle?: boolean
}) => (
	<ResizablePrimitive.PanelResizeHandle
		className={cn(
			'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
			className
		)}
		{...props}
	>
		{withHandle && (
			<div className='z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border'>
				<svg className='h-2.5 w-2.5' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'>
					<path
						fill='currentColor'
						d='M128 80a8 8 0 0 1 8 8v64a8 8 0 0 1-16 0V88a8 8 0 0 1 8-8ZM128 176a8 8 0 0 1 8 8v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 8-8Z'
					/>
				</svg>
			</div>
		)}
	</ResizablePrimitive.PanelResizeHandle>
)

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
