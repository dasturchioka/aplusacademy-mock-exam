'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'

interface DeleteConfirmationModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => Promise<void>
	title: string
	description: string
	warningMessage?: string
	itemCount?: number
	isLoading?: boolean
	destructiveAction?: boolean
}

export default function DeleteConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	warningMessage,
	itemCount = 1,
	isLoading = false,
	destructiveAction = true,
}: DeleteConfirmationModalProps) {
	const handleConfirm = async () => {
		try {
			await onConfirm()
			onClose()
		} catch (error) {
			console.error('Error during deletion:', error)
		}
	}

	const handleCancel = () => {
		if (!isLoading) {
			onClose()
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleCancel}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2 text-red-600'>
						<AlertTriangle className='h-5 w-5' />
						{title}
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					<p className='text-gray-700'>{description}</p>

					{itemCount > 1 && (
						<div className='p-3 bg-orange-50 border border-orange-200 rounded-lg'>
							<p className='text-orange-800 font-medium'>
								You are about to delete {itemCount} items.
							</p>
						</div>
					)}

					{warningMessage && (
						<Alert variant='destructive'>
							<AlertTriangle className='h-4 w-4' />
							<AlertDescription>
								<strong>Warning:</strong> {warningMessage}
							</AlertDescription>
						</Alert>
					)}

					<Alert>
						<AlertDescription>
							This action cannot be undone. Please make sure you want to proceed.
						</AlertDescription>
					</Alert>
				</div>

				<DialogFooter className='gap-2'>
					<Button variant='outline' onClick={handleCancel} disabled={isLoading}>
						Cancel
					</Button>
					<Button variant='destructive' onClick={handleConfirm} disabled={isLoading}>
						{isLoading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
						<Trash2 className='h-4 w-4 mr-2' />
						{isLoading ? 'Deleting...' : `Delete ${itemCount > 1 ? `${itemCount} Items` : 'Item'}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
