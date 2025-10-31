/**
 * Simplified storage system - only keeps result ID after listening completion
 * Now uses sessionStorage instead of localStorage as per user requirements
 */

const STORAGE_KEYS = {
	CURRENT_RESULT_ID: 'ielts_current_result_id',
}

export class SimpleStorage {
	// Only methods for result ID management
	static setResultId(resultId: string): void {
		sessionStorage.setItem(STORAGE_KEYS.CURRENT_RESULT_ID, resultId)
		console.log('💾 Saved result ID to sessionStorage:', resultId)
	}

	static getResultId(): string | null {
		return sessionStorage.getItem(STORAGE_KEYS.CURRENT_RESULT_ID)
	}

	static clearResultId(): void {
		sessionStorage.removeItem(STORAGE_KEYS.CURRENT_RESULT_ID)
	}

	// Clear all exam data on page reload (except result ID)
	static clearAllExamData(): void {
		// Get all sessionStorage keys
		const keysToRemove: string[] = []
		for (let i = 0; i < sessionStorage.length; i++) {
			const key = sessionStorage.key(i)
			if (key && key.startsWith('ielts_') && key !== STORAGE_KEYS.CURRENT_RESULT_ID) {
				keysToRemove.push(key)
			}
		}

		// Remove all exam-related keys except result ID
		keysToRemove.forEach(key => sessionStorage.removeItem(key))
		console.log('🧹 Cleared all exam data from sessionStorage (keeping result ID):', keysToRemove)
	}

	// Clear everything including result ID (for fresh start)
	static clearEverything(): void {
		const keysToRemove: string[] = []
		for (let i = 0; i < sessionStorage.length; i++) {
			const key = sessionStorage.key(i)
			if (key && key.startsWith('ielts_')) {
				keysToRemove.push(key)
			}
		}

		keysToRemove.forEach(key => sessionStorage.removeItem(key))
		console.log('🗑️ Cleared everything from sessionStorage:', keysToRemove)
	}
}
