import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'
import HandleReloadOrCloseTab from '@/components/HandleReloadOrCloseTab'
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Aplusacademy Mock Exam Platform | Realistic IELTS Practice Tests Online",
  description:
    "At Aplusacademy, our Mock Exam Platform offers a realistic IELTS test experience with full support for Listening, Reading, Writing, and Speaking sections. Designed to mirror the official exam format, it features auto-saving, answer tracking, and performance feedback — helping students build confidence through smart, structured practice.",
  keywords: [
    "Aplusacademy mock exam platform",
    "IELTS mock exam",
    "IELTS practice test",
    "IELTS online exam",
    "IELTS preparation platform",
    "IELTS listening test",
    "IELTS reading test",
    "IELTS writing test",
    "IELTS speaking test",
    "mock IELTS test online",
    "IELTS test simulator",
    "IELTS performance feedback",
    "IELTS exam practice Uzbekistan",
    "IELTS Exam platform by dasturchioka"
  ],
  openGraph: {
    title: "Aplusacademy Mock Exam Platform | Realistic IELTS Practice Tests",
    description:
      "Realistic IELTS mock exams with Listening, Reading, Writing, and Speaking. Practice smart with real-time feedback, answer tracking, and auto-saving.",
    url: "https://aplusacademy.uz",
    siteName: "Aplusacademy Mock Exam Platform",
    images: [
      {
        url: "https://aplusacademy.uz/og-image.jpg", // replace with your actual OG image
        width: 1200,
        height: 630,
        alt: "Aplusacademy Mock Exam Platform - IELTS Practice",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aplusacademy Mock Exam Platform | Realistic IELTS Practice Tests",
    description:
      "Experience IELTS mock exams online — Listening, Reading, Writing, and Speaking with real feedback, answer tracking, and performance analytics.",
    creator: "@dasturchioka",
    images: ["https://aplusacademy.uz/og-image.jpg"],
  },
  authors: [{ name: "Dasturchi Oka", url: "https://dasturchioka.uz" }],
};


export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en'>
			<body>{children}</body>
		</html>
	)
}
