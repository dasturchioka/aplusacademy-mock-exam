import React from 'react'
import { Lock } from 'lucide-react'
import { Figtree } from 'next/font/google'

const figtree = Figtree({ subsets: ['latin'] })

export default function EnterAdminPanelButton({ bg }: { bg?: string }) {
	return (
		<button
			onClick={() => window.location.href = "/auth/admin"}
			className={`relative font-manrope overflow-hidden rounded-full ${
				bg ?? 'bg-neutral-950'
			} px-5 py-2.5 text-white duration-300 [transition-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)] active:translate-y-1 active:scale-x-110 active:scale-y-90 flex items-center justify-between cursor-pointer group ${
				figtree.className
			}`}
		>
			<div className='absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]'>
				<div className='relative h-full w-8 bg-white/20'></div>
			</div>
			<Lock className='mr-2 size-5' /> Admin Panel
		</button>
	)
}
