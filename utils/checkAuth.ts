// Authentication utilities for session management
import { defaultInstance as axios } from '@/http/index'
import { getAuthToken, getAuthUser, logoutAuthSession } from '@/lib/authClient'

export const requireExamAccess = async (userId?: string): Promise<boolean> => {
	try {
		if (!getAuthToken() || !userId) {
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

export const requireAdminAccess = async (_userId?: string): Promise<boolean> => {
	try {
		if (!getAuthToken()) {
			throw new Error('Authentication required')
		}

		const response = await axios.get('/api/auth/me')

		if (!response.data.success || response.data.user?.role !== 'admin') {
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
	const authUser = getAuthUser()
	if (authUser?.role === 'student') {
		return {
			id: authUser.id,
			fullName: authUser.full_name,
			email: authUser.email,
			approved: false,
		}
	}

	return null
}

// Set user session in sessionStorage
export const setUserSession = (_user: any) => {
	return false
}

// Clear user session
export const clearUserSession = () => {
	if (typeof window === 'undefined') {
		return false // SSR safety
	}

	try {
		logoutAuthSession()
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
	const authUser = getAuthUser()
	return Boolean(getAuthToken() && authUser?.role === 'admin')
}

// Verify current session with backend
export const verifySession = async (): Promise<{ valid: boolean; user?: any }> => {
	try {
		const session = getUserSession()
		if (!session) {
			return { valid: false }
		}

		const response = await axios.get('/api/auth/me')
		if (response.data.success && response.data.user) {
			return { valid: true, user: response.data.user }
		}

		return { valid: false }
	} catch (error) {
		console.error('Session verification failed:', error)
		return { valid: false }
	}
}
