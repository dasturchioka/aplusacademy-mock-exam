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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User as UserType } from '@/types/db'
import { Hash, Loader2, Mail, User } from 'lucide-react'
import { useEffect, useState } from 'react'

interface EditUserModalProps {
	user: UserType | null
	isOpen: boolean
	onClose: () => void
	onSave: (
		userId: string,
		userData: { full_name: string; email: string; id: string; password?: string }
	) => Promise<void>
	isLoading?: boolean
}

export default function EditUserModal({
	user,
	isOpen,
	onClose,
	onSave,
	isLoading = false,
}: EditUserModalProps) {
	const [formData, setFormData] = useState({
		full_name: '',
		email: '',
		id: '',
		password: '',
	})
	const [errors, setErrors] = useState<{ [key: string]: string }>({})
	const [isSaving, setIsSaving] = useState(false)

	// Reset form when user changes or modal opens
	useEffect(() => {
		if (user && isOpen) {
			setFormData({
				full_name: user.full_name || '',
				email: user.email || '',
				id: user.id || '',
				password: '',
			})
			setErrors({})
		}
	}, [user, isOpen])

	const validateForm = () => {
		const newErrors: { [key: string]: string } = {}

		if (!formData.full_name.trim()) {
			newErrors.full_name = 'Full name is required'
		}

		if (!formData.email.trim()) {
			newErrors.email = 'Email is required'
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = 'Please enter a valid email address'
		}

		if (!formData.id.trim()) {
			newErrors.id = 'User ID is required'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSave = async () => {
		if (!user || !validateForm()) return

		try {
			setIsSaving(true)
			await onSave(user.id, {
				full_name: formData.full_name.trim(),
				email: formData.email.trim(),
				id: formData.id.trim(),
				...(formData.password.trim() ? { password: formData.password } : {}),
			})
			onClose()
		} catch (error) {
			console.error('Error saving user:', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		if (!isSaving) {
			onClose()
		}
	}

	if (!user) return null

	return (
		<Dialog open={isOpen} onOpenChange={handleCancel}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<User className='h-5 w-5' />
						Edit User Details
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					{/* Full Name */}
					<div className='space-y-2'>
						<Label htmlFor='full_name' className='flex items-center gap-2'>
							<User className='h-4 w-4' />
							Full Name
						</Label>
						<Input
							id='full_name'
							value={formData.full_name}
							onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
							placeholder='Enter full name'
							disabled={isSaving}
							className={errors.full_name ? 'border-red-500' : ''}
						/>
						{errors.full_name && <p className='text-sm text-red-500'>{errors.full_name}</p>}
					</div>

					{/* Email */}
					<div className='space-y-2'>
						<Label htmlFor='email' className='flex items-center gap-2'>
							<Mail className='h-4 w-4' />
							Email
						</Label>
						<Input
							id='email'
							type='email'
							value={formData.email}
							onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
							placeholder='Enter email address'
							disabled={isSaving}
							className={errors.email ? 'border-red-500' : ''}
						/>
						{errors.email && <p className='text-sm text-red-500'>{errors.email}</p>}
					</div>

					{/* User ID */}
					<div className='space-y-2'>
						<Label htmlFor='user_id' className='flex items-center gap-2'>
							<Hash className='h-4 w-4' />
							User ID
						</Label>
						<Input
							id='user_id'
							value={formData.id}
							onChange={e => setFormData(prev => ({ ...prev, id: e.target.value }))}
							placeholder='Enter user ID'
							disabled={isSaving}
							className={errors.id ? 'border-red-500' : ''}
						/>
						{errors.id && <p className='text-sm text-red-500'>{errors.id}</p>}
						<p className='text-xs text-gray-500'>
							Warning: Changing the user ID will affect all related records
						</p>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='edit-user-password'>New password</Label>
						<Input
							id='edit-user-password'
							type='password'
							value={formData.password}
							onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
							placeholder='Leave empty to keep current password'
							disabled={isSaving}
						/>
						<p className='text-xs text-gray-500'>
							Changing this will replace the user's current password.
						</p>
					</div>

					{/* Current vs New ID Warning */}
					{formData.id !== user.id && (
						<Alert>
							<AlertDescription>
								<strong>ID Change Detected:</strong> The user ID will be changed from "{user.id}" to
								"{formData.id}". This will update all related results and assignments.
							</AlertDescription>
						</Alert>
					)}
				</div>

				<DialogFooter className='gap-2'>
					<Button variant='outline' onClick={handleCancel} disabled={isSaving}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
