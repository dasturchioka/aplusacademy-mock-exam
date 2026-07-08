import { API_BASE_URL } from '@/http'

/**
 * Convert base64 string to Blob object
 */
export function base64ToBlob(base64: string): Blob {
	const byteCharacters = atob(base64.split(',')[1])
	const byteNumbers = new Array(byteCharacters.length)

	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i)
	}

	const byteArray = new Uint8Array(byteNumbers)
	return new Blob([byteArray], { type: 'image/png' })
}

/**
 * Upload base64 image to backend and return URL
 */
export async function uploadBase64Image(base64: string, filename: string): Promise<string> {
	const blob = base64ToBlob(base64)
	const formData = new FormData()
	formData.append('image', blob, `${filename}.png`)

	const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
		method: 'POST',
		body: formData,
	})

	const data = await response.json()

	if (!data.success) {
		throw new Error(data.error || 'Failed to upload image')
	}

	return data.url
}

/**
 * Process structure to convert base64 images to URLs
 */
export async function processStructureImages(structure: any): Promise<any> {
	const processedStructure = JSON.parse(JSON.stringify(structure))

	for (const part of processedStructure.parts) {
		for (const question of part.questions) {
			if (question.type === 'image' && question.base64) {
				try {
					const imageUrl = await uploadBase64Image(question.base64, question.questionId)
					question.url = imageUrl
					delete question.base64
				} catch (error) {
					console.error('Failed to upload base64 image:', error)
					// Keep base64 for retry or manual handling
				}
			}
		}
	}

	return processedStructure
}

/**
 * Check if structure contains base64 images that need processing
 */
export function hasBase64Images(structure: any): boolean {
	for (const part of structure.parts || []) {
		for (const question of part.questions || []) {
			if (question.type === 'image' && question.base64) {
				return true
			}
		}
	}
	return false
}
