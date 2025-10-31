import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	env: {
		BACKEND_URL: process.env.BACKEND_URL,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	reactStrictMode: false,
}

export default nextConfig
