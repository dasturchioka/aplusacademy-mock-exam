import axios from 'axios'

export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function buildMediaUrl(path: string) {
	if (!path) return ''
	if (path.startsWith('http://') || path.startsWith('https://')) return path
	if (path.startsWith('/')) return `${API_BASE_URL}${path}`
	return `${API_BASE_URL}/${path}`
}

export const defaultInstance = axios.create({
	baseURL: API_BASE_URL,
})

defaultInstance.interceptors.request.use(config => {
	if (typeof window !== 'undefined') {
		const token = window.sessionStorage.getItem('authToken')
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}
	}
	return config
})

export default defaultInstance
