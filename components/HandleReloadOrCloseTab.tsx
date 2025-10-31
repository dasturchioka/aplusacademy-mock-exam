'use client'

import { useEffect, useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function HandleReloadOrCloseTab() {
	const [showModal, setShowModal] = useState(false)
	const [action, setAction] = useState<'closing' | 'reloading' | null>(null)

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			// Instead of blocking, just open our custom modal
			e.stopImmediatePropagation()
			setShowModal(true)
			// Don’t set e.returnValue → avoids the ugly browser modal
		}

		window.addEventListener('beforeunload', handleBeforeUnload)

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [])

	const handleClosing = () => {
		localStorage.clear()
		sessionStorage.clear()
		setShowModal(false)
		setAction('closing')
		// user still has to manually close the tab (we can’t force it)
	}

	const handleReloading = () => {
		setShowModal(false)
		setAction('reloading')
		location.reload()
	}

	const handleCancel = () => {
		setShowModal(false)
		setAction(null)
		// do nothing, stay on page
	}

	return (
		<>
			<Dialog open={showModal} onOpenChange={setShowModal}>
				<DialogContent className='sm:max-w-md rounded-2xl shadow-xl'>
					<DialogHeader>
						<DialogTitle className='text-lg font-semibold text-center'>
							Are you closing or reloading the tab?
						</DialogTitle>
					</DialogHeader>

					<DialogFooter className='flex justify-center gap-3 mt-4'>
						<Button variant='destructive' onClick={handleClosing} className='px-6 py-2 rounded-xl'>
							Closing
						</Button>
						<Button variant='default' onClick={handleReloading} className='px-6 py-2 rounded-xl'>
							Reloading
						</Button>
						<Button variant='outline' onClick={handleCancel} className='px-6 py-2 rounded-xl'>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
