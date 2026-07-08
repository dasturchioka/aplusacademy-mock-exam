import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2, type LucideIcon } from 'lucide-react'
import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

type LoadingButtonProps = ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		loading?: boolean
		loadingText?: string
		icon?: LucideIcon
	}

export function LoadingButton({
	loading = false,
	loadingText,
	icon: Icon,
	children,
	disabled,
	className,
	...props
}: LoadingButtonProps) {
	return (
		<Button disabled={disabled || loading} className={cn('product-press', className)} {...props}>
			{loading ? <Loader2 className='size-4 animate-spin' /> : Icon ? <Icon className='size-4' /> : null}
			<span className='flex items-center justify-center space-x-2'>{loading ? loadingText ?? children : children}</span>
		</Button>
	)
}
