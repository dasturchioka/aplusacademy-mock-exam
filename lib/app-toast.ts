'use client'

import { toast } from 'sonner'

type ToastDescription = string | undefined

export const notify = {
	success(message: string, description?: ToastDescription) {
		toast.success(message, { description })
	},
	error(message: string, description?: ToastDescription) {
		toast.error(message, { description })
	},
	info(message: string, description?: ToastDescription) {
		toast.info(message, { description })
	},
}
