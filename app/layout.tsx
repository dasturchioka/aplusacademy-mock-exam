import './globals.css'
import { AppProviders } from '@/components/providers/AppProviders'
import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-body',
	display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
	subsets: ['latin'],
	variable: '--font-heading',
	display: 'swap',
})

export const metadata: Metadata = {
	title: 'Aplus Academy Mock Exam Platform | Realistic IELTS Practice Tests Online',
	description:
		'Aplus Academy Mock Exam Platform provides IELTS Listening, Reading, Writing, and result review workflows for center-managed mock exams.',
	keywords: [
		'IELTS mock exam',
		'IELTS practice test',
		'IELTS online exam',
		'IELTS preparation platform',
		'Aplus Academy mock platform',
	],
	openGraph: {
		title: 'Aplus Academy Mock Exam Platform',
		description: 'Center-managed IELTS mock exams with exam flow, approvals, and result review.',
		url: 'https://aplusacademy.uz',
		siteName: 'Aplus Academy Mock Exam Platform',
		images: [
			{
				url: 'https://aplusacademy.uz/og-image.jpg',
				width: 1200,
				height: 630,
				alt: 'Aplus Academy Mock Exam Platform',
			},
		],
		locale: 'en_US',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Aplus Academy Mock Exam Platform',
		description: 'IELTS mock exam platform for center-managed exam sessions.',
		images: ['https://aplusacademy.uz/og-image.jpg'],
	},
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en' className={`${inter.variable} ${plusJakarta.variable}`}>
			<body>
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	)
}
