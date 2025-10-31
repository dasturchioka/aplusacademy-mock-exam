'use client'
import { SectionCompletion } from '@/lib/sectionCompletion'
import { AlertCircle, CheckCircle, Database } from 'lucide-react'
import { useState } from 'react'

interface SectionCompleteButtonProps {
	section: 'Listening' | 'Reading' | 'Writing'
	onSectionComplete?: () => void
	className?: string
	disabled?: boolean
}

export default function SectionCompleteButton({
	section,
	onSectionComplete,
	className = '',
	disabled = false,
}: SectionCompleteButtonProps) {
	const [isSavingSection, setIsSavingSection] = useState(false)
	const [sectionSaveError, setSectionSaveError] = useState<string | null>(null)
	const [lastSaveResult, setLastSaveResult] = useState<{
		success: boolean
		timestamp: Date
		resultId?: string
	} | null>(null)

	const handleSectionComplete = async () => {
		try {
			setIsSavingSection(true)
			setSectionSaveError(null)

			const result = await SectionCompletion.completeSection(section)

			setLastSaveResult({
				success: result.success,
				timestamp: new Date(),
				resultId: result.resultId,
			})

			if (result.success) {
				console.log(`✅ ${section} section completed successfully!`, {
					resultId: result.resultId,
					timestamp: new Date().toISOString(),
				})

				if (onSectionComplete) {
					// Small delay to show success state
					setTimeout(onSectionComplete, 1500)
				}
			} else {
				setSectionSaveError(result.error || `Failed to complete ${section} section`)
			}
		} catch (error) {
			console.error(`Error completing ${section} section:`, error)
			setSectionSaveError(error instanceof Error ? error.message : 'Unknown error occurred')
			setLastSaveResult({
				success: false,
				timestamp: new Date(),
			})
		} finally {
			setIsSavingSection(false)
		}
	}

	const getButtonContent = () => {
		if (isSavingSection) {
			return (
				<>
					<Database className='w-4 h-4 animate-pulse' />
					Saving {section}...
				</>
			)
		}

		if (lastSaveResult?.success) {
			return (
				<>
					<CheckCircle className='w-4 h-4 text-green-600' />
					Redirecting...
				</>
			)
		}

		if (sectionSaveError || lastSaveResult?.success === false) {
			return (
				<>
					<AlertCircle className='w-4 h-4 text-red-600' />
					Retry Save
				</>
			)
		}

		return `Complete ${section} Section`
	}

	const getButtonClass = () => {
		let baseClass = `
      px-6 py-2 rounded-lg font-medium text-base transition-all duration-200
      flex items-center gap-2 justify-center min-w-[200px] cursor-pointer
      ${className}
    `

		if (disabled || isSavingSection || lastSaveResult?.success) {
			return baseClass + ' bg-gray-400 text-white cursor-not-allowed opacity-50'
		}

		if (sectionSaveError || lastSaveResult?.success === false) {
			return baseClass + ' bg-red-600 text-white hover:bg-red-700'
		}

		return baseClass + ' bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
	}

	return (
		<div className='space-y-2'>
			<button
				onClick={handleSectionComplete}
				disabled={disabled || isSavingSection || lastSaveResult?.success}
				className={getButtonClass()}
			>
				{getButtonContent()}
			</button>

			{sectionSaveError && (
				<div className='text-sm text-red-600 bg-red-50 p-2 rounded border'>
					<strong>Save Error:</strong> {sectionSaveError}
				</div>
			)}

			{lastSaveResult && (
				<div className='text-xs text-gray-500 text-center space-y-1'>
					{lastSaveResult.success ? (
						<>
							<div className='text-green-600'>
								✓ Saved at {lastSaveResult.timestamp.toLocaleTimeString()}
							</div>
						</>
					) : (
						<span className='text-red-600'>
							✗ Save failed at {lastSaveResult.timestamp.toLocaleTimeString()}
						</span>
					)}
				</div>
			)}
		</div>
	)
}
