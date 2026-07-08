import { getImageFileName } from './questionUtils'

export interface ImageUploadOptions {
	questionId: string
	test: string
	section: string
	part: number
	questionType: string
}

export interface ImageUploadResult {
	success: boolean
	url?: string
	error?: string
	metadata?: {
		questionId: string
		originalName: string
		size: number
		type: string
		uploadedAt: string
	}
}

/**
 * Upload image with proper metadata and file naming
 */
export async function uploadQuestionImage(
	file: File,
	options: ImageUploadOptions
): Promise<ImageUploadResult> {
	try {
		// Validate file type
		if (!file.type.startsWith('image/')) {
			return { success: false, error: 'Please select a valid image file' }
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			return { success: false, error: 'Image file size must be less than 5MB' }
		}

		// Generate proper file name
		const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
		const fileName = getImageFileName(
			options.questionId,
			options.test,
			options.section,
			options.part,
			extension
		)

		// Create form data with metadata
		const formData = new FormData()
		formData.append('image', file)
		formData.append('questionId', options.questionId)
		formData.append('test', options.test)
		formData.append('section', options.section)
		formData.append('part', options.part.toString())
		formData.append('questionType', options.questionType)
		formData.append('fileName', fileName)

		// Upload to backend
		const response = await fetch('http://localhost:3001/api/upload-image', {
			method: 'POST',
			body: formData,
		})

		const result = await response.json()

		if (!response.ok) {
			return { success: false, error: result.error || 'Upload failed' }
		}

		if (result.success) {
			return {
				success: true,
				url: result.url,
				metadata: {
					questionId: options.questionId,
					originalName: file.name,
					size: file.size,
					type: file.type,
					uploadedAt: new Date().toISOString(),
				},
			}
		}

		return { success: false, error: result.error || 'Upload failed' }
	} catch (error) {
		console.error('Image upload error:', error)
		return { success: false, error: 'Network error occurred' }
	}
}

/**
 * Delete image by questionId
 */
export async function deleteQuestionImage(
	questionId: string,
	test: string,
	section: string,
	part: number
): Promise<boolean> {
	try {
		const response = await fetch('http://localhost:3001/api/delete-image', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ questionId, test, section, part }),
		})

		const result = await response.json()
		return result.success
	} catch (error) {
		console.error('Image deletion error:', error)
		return false
	}
}

/**
 * Check if image upload is allowed for question type
 */
export function canUploadImage(questionType: string): boolean {
	return ['image', 'map-labelling'].includes(questionType)
}

/**
 * Get image preview URL with fallback
 */
export function getImagePreviewUrl(url: string | undefined): string | null {
	if (!url) return null

	// Handle relative URLs
	if (url.startsWith('/')) {
		return `http://localhost:3001${url}`
	}

	// Handle full URLs
	if (url.startsWith('http')) {
		return url
	}

	// Handle other cases
	return `http://localhost:3001/uploads/${url}`
}

/**
 * Create image placeholder for question
 */
export function createImagePlaceholder(
	questionId: string,
	headline: string = 'Image'
): { url: string; headline: string } {
	return {
		url: '',
		headline,
	}
}

/**
 * Validate image metadata
 */
export function validateImageMetadata(metadata: any): boolean {
	return !!(
		metadata &&
		metadata.questionId &&
		metadata.originalName &&
		metadata.size &&
		metadata.type &&
		metadata.uploadedAt
	)
}
