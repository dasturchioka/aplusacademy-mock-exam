'use client'

import defaultInstance from '@/http'
import type { AuthSession, AuthUser, UserRole } from '@/types/db'
import { clearVisibleExamState } from './answerHandlers'

export const AUTH_TOKEN_STORAGE_KEY = 'authToken'
export const AUTH_USER_STORAGE_KEY = 'authUser'

function isBrowser() {
	return typeof window !== 'undefined'
}

export function getAuthToken(): string | null {
	if (!isBrowser()) return null
	return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function getAuthUser(): AuthUser | null {
	if (!isBrowser()) return null
	const raw = window.sessionStorage.getItem(AUTH_USER_STORAGE_KEY)
	if (!raw) return null

	try {
		return JSON.parse(raw) as AuthUser
	} catch {
		window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY)
		return null
	}
}

export function setAuthSession(session: AuthSession) {
	if (!isBrowser()) return
	window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token)
	window.sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user))
}

export function logoutAuthSession() {
	if (!isBrowser()) return
	window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
	window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY)
	window.sessionStorage.removeItem('adminSession')
	window.sessionStorage.removeItem('isAdminLoggedIn')
	window.sessionStorage.removeItem('user')
	clearVisibleExamState()
}

export async function loginStudent(params: { studentId: string; password: string }) {
	const response = await defaultInstance.post<AuthSession & { success: boolean }>('/api/auth/login', {
		role: 'student',
		studentId: params.studentId,
		password: params.password,
	})
	setAuthSession({
		token: response.data.token,
		user: response.data.user,
		expiresIn: response.data.expiresIn,
	})
	return response.data
}

export async function loginAdmin(params: { email: string; password: string }) {
	const response = await defaultInstance.post<AuthSession & { success: boolean }>('/api/auth/login', {
		role: 'admin',
		email: params.email,
		password: params.password,
	})
	setAuthSession({
		token: response.data.token,
		user: response.data.user,
		expiresIn: response.data.expiresIn,
	})
	return response.data
}

export async function fetchCurrentUser() {
	const response = await defaultInstance.get<{ success: boolean; user: AuthUser }>('/api/auth/me')
	window.sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(response.data.user))
	return response.data.user
}

export async function changePassword(params: { currentPassword: string; newPassword: string }) {
	const response = await defaultInstance.patch('/api/auth/password', params)
	return response.data
}

export function requireRole(role: UserRole) {
	const user = getAuthUser()
	const token = getAuthToken()
	return Boolean(token && user?.role === role)
}
