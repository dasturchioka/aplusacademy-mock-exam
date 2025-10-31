import axios from 'axios'

export const defaultInstance = axios.create({
	baseURL: process.env.BACKEND_URL || 'http://localhost:3001',
})

export default defaultInstance
