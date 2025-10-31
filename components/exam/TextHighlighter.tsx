'use client'

import { Button } from '@/components/ui/button'
import { PaintBucket } from 'lucide-react'
import { ReactNode, useEffect, useRef, useState } from 'react'

interface Highlight {
	id: string
	text: string
	color: string
	element: HTMLElement
}

interface TextHighlighterProps {
	children: ReactNode
	className?: string
}

const YELLOW = { name: 'Yellow', value: '#FEF3C7', border: '#F59E0B' }

export default function TextHighlighter({ children, className = '' }: TextHighlighterProps) {
	const [highlights, setHighlights] = useState<Highlight[]>([])
	const [selectionMenu, setSelectionMenu] = useState<{
		show: boolean
		x: number
		y: number
		text: string
		range?: Range
	}>({ show: false, x: 0, y: 0, text: '' })

	const containerRef = useRef<HTMLDivElement>(null)

	// Handle text selection
	useEffect(() => {
		const handleSelection = (e: MouseEvent) => {
			setTimeout(() => {
				const selection = window.getSelection()
				if (!selection || selection.rangeCount === 0) {
					setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
					return
				}

				const range = selection.getRangeAt(0)
				const selectedText = selection.toString().trim()

				if (!selectedText || !containerRef.current?.contains(range.commonAncestorContainer)) {
					setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
					return
				}

				const rect = range.getBoundingClientRect()
				const containerRect = containerRef.current.getBoundingClientRect()

				setSelectionMenu({
					show: true,
					x: rect.left - containerRect.left + rect.width / 2,
					y: rect.top - containerRect.top - 60,
					text: selectedText,
					range: range.cloneRange(),
				})
			}, 10)
		}

		const handleClick = (e: MouseEvent) => {
			const target = e.target as Element

			// Double-click a highlight to remove
			if (
				target.tagName === 'MARK' &&
				(target as HTMLElement).classList.contains('text-highlight') &&
				(e as any).detail === 2
			) {
				const highlightId = (target as HTMLElement).getAttribute('data-highlight-id')
				if (highlightId) removeHighlight(highlightId)
				return
			}

			if ((target as Element).closest('.highlight-menu')) return

			setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
		}

		document.addEventListener('mouseup', handleSelection)
		document.addEventListener('click', handleClick)

		return () => {
			document.removeEventListener('mouseup', handleSelection)
			document.removeEventListener('click', handleClick)
		}
	}, [])

	const applyHighlight = () => {
		if (!selectionMenu.range || !containerRef.current) return

		const selRange = selectionMenu.range

		try {
			const frag = selRange.cloneContents()
			const createdMarks: HTMLElement[] = []

			const createMark = (textNodeValue: string) => {
				const mark = document.createElement('mark')
				mark.style.backgroundColor = YELLOW.value
				mark.style.cursor = 'pointer'
				mark.title = 'Double-click to remove highlight'
				mark.className = 'text-highlight'
				const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
				mark.setAttribute('data-highlight-id', highlightId)
				mark.appendChild(document.createTextNode(textNodeValue))
				return mark
			}

			const wrapTextNodesRecursively = (node: Node) => {
				if (node.nodeType === Node.TEXT_NODE) {
					if (node.nodeValue && node.nodeValue.length > 0) {
						const mark = createMark(node.nodeValue)
						createdMarks.push(mark)
						node.parentNode!.replaceChild(mark, node)
					}
					return
				}
				if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
					const children = Array.from(node.childNodes)
					for (const child of children) wrapTextNodesRecursively(child)
				}
			}

			wrapTextNodesRecursively(frag)
			if (createdMarks.length === 0) {
				window.getSelection()?.removeAllRanges()
				setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
				return
			}

			selRange.deleteContents()
			selRange.insertNode(frag)

			const newHighlights: Highlight[] = createdMarks.map(mark => ({
				id:
					mark.getAttribute('data-highlight-id') ||
					`highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				text: mark.textContent ?? selectionMenu.text,
				color: YELLOW.value,
				element: mark as HTMLElement,
			}))
			setHighlights(prev => [...prev, ...newHighlights])
		} catch (error) {
			console.warn('Highlighting error (robust highlighter):', error)
		}

		window.getSelection()?.removeAllRanges()
		setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
	}

	const removeHighlight = (highlightId: string) => {
		const mark = containerRef.current?.querySelector(`[data-highlight-id="${highlightId}"]`)
		if (!mark || !mark.parentNode) return

		try {
			const parent = mark.parentNode
			while (mark.firstChild) {
				parent.insertBefore(mark.firstChild, mark)
			}
			parent.removeChild(mark)
			setHighlights(prev => prev.filter(h => h.id !== highlightId))
			parent.normalize()
		} catch (error) {
			console.warn('Error removing highlight:', error)
		}
	}

	return (
		<div ref={containerRef} className={`relative user-select-text overflow-y-visible ${className}`}>
			<div className='exam-text-scalable passage-content'>{children}</div>
			{selectionMenu.show && (
				<div
					className='highlight-menu absolute z-50 flex items-center gap-1 bg-white border border-gray-300 rounded-lg shadow-lg p-1 top-1'
					style={{ left: selectionMenu.x, top: selectionMenu.y, transform: 'translateX(-50%)' }}
					onClick={e => e.stopPropagation()}
				>
					<Button
						size='sm'
						variant='outline'
						onClick={e => {
							e.stopPropagation()
							applyHighlight()
						}}
						className='w-auto h-8 px-2'
					>
						<PaintBucket className='h-3 w-3 mr-1' /> Highlight
					</Button>
				</div>
			)}

			<style jsx>{`
				.user-select-text {
					user-select: text;
					-webkit-user-select: text;
					-moz-user-select: text;
					-ms-user-select: text;
				}
				.passage-content {
					line-height: 1.6;
				}
				.text-highlight {
					display: inline;
					line-height: inherit;
				}
			`}</style>
		</div>
	)
}
