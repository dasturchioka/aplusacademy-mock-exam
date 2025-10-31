import { Button } from '@/components/ui/button'
import { Edit3 } from 'lucide-react'
import { ReactNode, useEffect, useRef, useState } from 'react'

interface Highlight {
	id: string
	text: string
	color: string
	element: HTMLElement
}

interface EnhancedTextHighlighterProps {
	children: ReactNode
	className?: string
	isQuestionText?: boolean // For styling question content differently
}

const YELLOW = { name: 'Yellow', value: '#FEF3C7', border: '#F59E0B' }

export default function EnhancedTextHighlighter({
	children,
	className = '',
	isQuestionText = false,
}: EnhancedTextHighlighterProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [highlights, setHighlights] = useState<Highlight[]>([])
	const [selectionMenu, setSelectionMenu] = useState<{
		show: boolean
		x: number
		y: number
		text: string
		range?: Range
	}>({ show: false, x: 0, y: 0, text: '' })

	// Handle text selection
	useEffect(() => {
		const handleSelection = (e: MouseEvent) => {
			const selection = window.getSelection()
			if (!selection || selection.rangeCount === 0) return

			const range = selection.getRangeAt(0)
			const selectedText = range.toString().trim()

			// Only show menu if text is selected and selection is within our container
			if (selectedText && containerRef.current?.contains(range.commonAncestorContainer)) {
				const rect = range.getBoundingClientRect()
				const scrollY = window.scrollY || document.documentElement.scrollTop

				setSelectionMenu({
					show: true,
					x: rect.left + rect.width / 2,
					y: rect.top + scrollY - 50,
					text: selectedText,
					range: range.cloneRange(),
				})
			}
		}

		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement

			// Handle highlight removal on double-click
			if (e.detail === 2 && target.classList.contains('text-highlight')) {
				e.preventDefault()
				const highlightId = target.getAttribute('data-highlight-id')
				if (highlightId) {
					removeHighlight(highlightId)
				}
				return
			}

			// Hide selection menu if clicking outside
			if (!containerRef.current?.contains(target) || !target.closest('.selection-menu')) {
				setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
			}
		}

		document.addEventListener('mouseup', handleSelection)
		document.addEventListener('click', handleClick)

		return () => {
			document.removeEventListener('mouseup', handleSelection)
			document.removeEventListener('click', handleClick)
		}
	}, [])

	// Apply highlight to current selection (always yellow)
	const applyHighlight = () => {
		if (!selectionMenu.range || !containerRef.current) return

		try {
			// Create a new mark element
			const mark = document.createElement('mark')
			mark.style.backgroundColor = YELLOW.value
			mark.style.cursor = 'pointer'
			mark.title = 'Double-click to remove highlight'
			mark.className = 'text-highlight'

			// Generate unique ID
			const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
			mark.setAttribute('data-highlight-id', highlightId)

			// Surround the range contents with the mark
			try {
				selectionMenu.range.surroundContents(mark)

				// Store highlight data
				const newHighlight: Highlight = {
					id: highlightId,
					text: selectionMenu.text,
					color: YELLOW.value,
					element: mark,
				}

				setHighlights(prev => [...prev, newHighlight])
			} catch (error) {
				console.warn('Could not apply highlight to complex selection:', error)
				// For complex selections, fallback
				try {
					const contents = selectionMenu.range.extractContents()
					mark.appendChild(contents)
					selectionMenu.range.insertNode(mark)

					const newHighlight: Highlight = {
						id: highlightId,
						text: selectionMenu.text,
						color: YELLOW.value,
						element: mark,
					}

					setHighlights(prev => [...prev, newHighlight])
				} catch (secondError) {
					console.warn('Failed to apply highlight:', secondError)
				}
			}
		} catch (error) {
			console.warn('Highlighting error:', error)
		}

		// Clear selection and menu
		window.getSelection()?.removeAllRanges()
		setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
	}

	// Remove highlight
	const removeHighlight = (highlightId: string) => {
		setHighlights(prev => {
			const highlight = prev.find(h => h.id === highlightId)
			if (highlight && highlight.element.parentNode) {
				const parent = highlight.element.parentNode
				const textNode = document.createTextNode(highlight.element.textContent || '')
				parent.replaceChild(textNode, highlight.element)
				parent.normalize()
			}
			return prev.filter(h => h.id !== highlightId)
		})
	}

	return (
		<div className='relative'>
			{/* Main content container */}
			<div
				ref={containerRef}
				className={`${className} ${
					isQuestionText
						? 'exam-text-scalable question-content'
						: 'exam-text-scalable passage-content'
				}`}
			>
				{children}
			</div>

			{/* Selection menu */}
			{selectionMenu.show && (
				<div
					className='selection-menu fixed z-[9999] bg-white border border-gray-200 shadow-lg rounded-lg p-2 flex items-center gap-2'
					style={{
						left: selectionMenu.x - 40,
						top: selectionMenu.y,
					}}
				>
					<Button
						variant='ghost'
						size='sm'
						onClick={applyHighlight}
						className='h-8 px-2'
						title='Highlight'
					>
						<Edit3 className='h-4 w-4 mr-1' /> Highlight
					</Button>
				</div>
			)}
		</div>
	)
}
