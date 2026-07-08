'use client'
import { Button } from '@/components/ui/button'
import { Minus, Plus, SunDim, SunIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SectionOptionsProps {
	className?: string
}

export function SectionOptions({ className = '' }: SectionOptionsProps) {
	const [eyeComfortLevel, setEyeComfortLevel] = useState(0)
	const [textSizeLevel, setTextSizeLevel] = useState(0)

	// Apply eye comfort overlay (full-screen tint, non-interactive)
	useEffect(() => {
		const overlayId = 'eye-comfort-overlay'
		let overlay = document.getElementById(overlayId) as HTMLDivElement | null
		if (!overlay) {
			overlay = document.createElement('div')
			overlay.id = overlayId
			overlay.style.position = 'fixed'
			overlay.style.inset = '0'
			overlay.style.pointerEvents = 'none'
			overlay.style.zIndex = '2147483646'
			overlay.style.transition = 'background-color 180ms ease'
			document.body.appendChild(overlay)
		}

		// Normalize level -10..+10
		const level = Math.max(-10, Math.min(10, eyeComfortLevel))
		const normalized = level / 10
		const amount = Math.abs(normalized)

		// Updated: Warmer amber tone & slightly stronger opacity
		const alpha = (0.25 * amount).toFixed(3)
		const warmColor = `rgba(255, 183, 76, ${alpha})` // strong amber
		const coolColor = `rgba(180, 210, 255, ${alpha})` // softer blue

		const color =
			amount > 0
				? normalized >= 0
					? warmColor // warm
					: coolColor // cool
				: 'transparent'

		overlay.style.backgroundColor = color
	}, [eyeComfortLevel])

	// Apply text size changes via CSS variables
	useEffect(() => {
		const styleId = 'exam-text-size-style'
		let style = document.getElementById(styleId) as HTMLStyleElement | null
		if (!style) {
			style = document.createElement('style')
			style.id = styleId
			document.head.appendChild(style)
		}

		const scale = 1 + textSizeLevel * 0.05 // 0.6x to 1.4x across -8..+8
		const lineMultiplier = 1 + textSizeLevel * 0.02

		style.textContent = `
:root { --text-scale: ${scale.toFixed(3)}; --text-line-multiplier: ${lineMultiplier.toFixed(3)}; }

/* Never scale tab lists */
.tablist, [role="tablist"] { --text-scale: 1 !important; --text-line-multiplier: 1 !important; }

/* Scale only intended exam content areas and their descendants */
.exam-text-scalable, .exam-text-scalable *,
.passage-content, .passage-content *,
.question-content, .question-content *,
.instruction-text, .instruction-text * {
  font-size: calc(1rem * var(--text-scale)) !important;
  line-height: calc(1.4 * var(--text-line-multiplier)) !important;
  transition: font-size 120ms ease, line-height 120ms ease;
}
`
	}, [textSizeLevel])

	// Cleanup both styles/elements on unmount only
	useEffect(() => {
		return () => {
			;['exam-text-size-style', 'eye-comfort-style', 'eye-comfort-overlay'].forEach(id => {
				const el = document.getElementById(id)
				if (el && el.parentNode) el.parentNode.removeChild(el)
			})
		}
	}, [])

	const increaseEyeComfort = () => setEyeComfortLevel(prev => Math.min(10, prev + 1))
	const decreaseEyeComfort = () => setEyeComfortLevel(prev => Math.max(-10, prev - 1))
	const increaseTextSize = () => setTextSizeLevel(prev => Math.min(8, prev + 1))
	const decreaseTextSize = () => setTextSizeLevel(prev => Math.max(-8, prev - 1))

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			{/* Eye Comfort Controls */}
			<div className='flex items-center gap-1 border-r pr-2'>
				<Button
					variant='ghost'
					size='sm'
					onClick={decreaseEyeComfort}
					className='h-8 w-8 p-0'
					title='Reduce eye comfort filter'
				>
					<SunDim className='h-4 w-4' />
				</Button>
				<span className='text-xs text-gray-600 min-w-[12px] text-center'>{eyeComfortLevel}</span>
				<Button
					variant='ghost'
					size='sm'
					onClick={increaseEyeComfort}
					className='h-8 w-8 p-0'
					title='Increase eye comfort filter'
				>
					<SunIcon className='h-4 w-4' />
				</Button>
			</div>

			{/* Text Size Controls */}
			<div className='flex items-center gap-1'>
				<Button
					variant='ghost'
					size='sm'
					onClick={decreaseTextSize}
					className='h-8 w-8 p-0'
					title='Decrease text size'
				>
					<Minus className='h-4 w-4' />
				</Button>
				<span className='text-xs text-gray-600 min-w-[20px] text-center'>
					{textSizeLevel > 0 ? `+${textSizeLevel}` : textSizeLevel === 0 ? '0' : textSizeLevel}
				</span>
				<Button
					variant='ghost'
					size='sm'
					onClick={increaseTextSize}
					className='h-8 w-8 p-0'
					title='Increase text size'
				>
					<Plus className='h-4 w-4' />
				</Button>
			</div>
		</div>
	)
}
