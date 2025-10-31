// Authentication utilities for session management
import { defaultInstance as axios } from '@/http/index'

export const requireExamAccess = async (userId?: string): Promise<boolean> => {
	try {
		if (!userId) {
			throw new Error('User ID is required')
		}

		const response = await axios.get(`/api/exam/access/${userId}`)

		if (!response.data.success || !response.data.hasAccess) {
			throw new Error('Access denied')
		}

		return true
	} catch (error) {
		console.error('Exam access check failed:', error)
		return false
	}
}

export const requireAdminAccess = async (userId?: string): Promise<boolean> => {
	try {
		if (!userId) {
			throw new Error('User ID is required')
		}

		const response = await axios.get(`/api/exam/access/${userId}`)

		if (!response.data.success || !response.data.user || response.data.user.role !== 'admin') {
			throw new Error('Admin access required')
		}

		return true
	} catch (error) {
		console.error('Admin access check failed:', error)
		return false
	}
}

// Get user session from sessionStorage
export const getUserSession = () => {
	if (typeof window === 'undefined') {
		return null // SSR safety
	}

	try {
		const session = sessionStorage.getItem('user')
		if (!session) return null

		const sessionParsed = JSON.parse(session)
		if (!sessionParsed.id) return null

		return sessionParsed
	} catch (error) {
		console.error('Failed to parse user session:', error)
		return null
	}
}

// Set user session in sessionStorage
export const setUserSession = (user: any) => {
	if (typeof window === 'undefined') {
		return false // SSR safety
	}

	try {
		sessionStorage.setItem('user', JSON.stringify(user))
		return true
	} catch (error) {
		console.error('Failed to set user session:', error)
		return false
	}
}

// Clear user session
export const clearUserSession = () => {
	if (typeof window === 'undefined') {
		return false // SSR safety
	}

	try {
		sessionStorage.removeItem('user')
		return true
	} catch (error) {
		console.error('Failed to clear user session:', error)
		return false
	}
}

// Check if user is logged in (client-side only)
export const isUserLoggedIn = (): boolean => {
	const session = getUserSession()
	return session !== null && !!session.id
}

// For backward compatibility - simplified version for client-side usage
export const checkExamAccess = (): boolean => {
	return isUserLoggedIn()
}

export const checkAdminAccess = (): boolean => {
	const session = getUserSession()
	return session !== null && session.role === 'admin'
}

// Verify current session with backend
export const verifySession = async (): Promise<{ valid: boolean; user?: any }> => {
	try {
		const session = getUserSession()
		if (!session) {
			return { valid: false }
		}

		const response = await axios.get(`/api/exam/access/${session.id}`)
		if (response.data.success && response.data.user) {
			// Update session with fresh user data
			setUserSession(response.data.user)
			return { valid: true, user: response.data.user }
		}

		return { valid: false }
	} catch (error) {
		console.error('Session verification failed:', error)
		return { valid: false }
	}
}
