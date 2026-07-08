'use client'

import { Button } from '@/components/ui/button'
import { getCaretFromPoint, isHighlightApiSupported } from '@/utils/highlightUtils'
import { ReactNode, useEffect, useRef, useState } from 'react'

type ColorKey = 'yellow' | 'green' | 'pink'

interface HighlightEntry {
  id: string
  start: number
  end: number
  color: ColorKey
  layer: number
}

interface SelectionMenuState {
  show: boolean
  x: number
  y: number
  text: string
  start?: number
  end?: number
}

interface TextSpan {
  node: Text
  start: number
  end: number
}

const COLORS: Record<ColorKey, { bg: string; label: string }> = {
  yellow: { bg: '#FEF3C7', label: 'Yellow' },
  green: { bg: '#D1FAE5', label: 'Green' },
  pink: { bg: '#FCE7F3', label: 'Pink' },
}

function createHighlightId() {
  return `highlight-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA
}

function subtractInterval(
  start: number,
  end: number,
  cutStart: number,
  cutEnd: number
) {
  if (!overlaps(start, end, cutStart, cutEnd)) return [{ start, end }]

  const fragments: Array<{ start: number; end: number }> = []

  if (start < cutStart) {
    fragments.push({ start, end: cutStart })
  }

  if (cutEnd < end) {
    fragments.push({ start: cutEnd, end })
  }

  return fragments
}

function getRegistryName(instanceId: string, color: ColorKey) {
  return `exam-highlight-${instanceId}-${color}`
}

function ensureHighlightStyles(instanceId: string) {
  if (typeof document === 'undefined') return
  const styleId = `exam-highlight-styles-${instanceId}`
  if (document.getElementById(styleId)) return

  const css = (Object.keys(COLORS) as ColorKey[])
    .map(
      color =>
        `::highlight(${getRegistryName(instanceId, color)}) { background-color: ${COLORS[color].bg}; }`
    )
    .join('\n')

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = css
  document.head.appendChild(style)
}

function collectTextSpans(root: Node | null) {
  if (!root) {
    return { spans: [] as TextSpan[], totalLength: 0 }
  }

  const spans: TextSpan[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()
  let offset = 0

  while (current) {
    const node = current as Text
    const length = node.textContent?.length ?? 0
    spans.push({ node, start: offset, end: offset + length })
    offset += length
    current = walker.nextNode()
  }

  return { spans, totalLength: offset }
}

function boundaryToOffset(root: Node, node: Node, offset: number) {
  try {
    const range = document.createRange()
    range.selectNodeContents(root)
    range.setEnd(node, offset)
    return range.toString().length
  } catch {
    return null
  }
}

function rangeToOffsets(root: Node, range: Range) {
  const start = boundaryToOffset(root, range.startContainer, range.startOffset)
  const end = boundaryToOffset(root, range.endContainer, range.endOffset)

  if (start === null || end === null || start === end) return null

  return start < end ? { start, end } : { start: end, end: start }
}

function offsetToBoundary(
  offset: number,
  spans: TextSpan[],
  totalLength: number
): { node: Text; offset: number } | null {
  if (spans.length === 0) return null

  const clamped = Math.max(0, Math.min(offset, totalLength))

  for (const span of spans) {
    if (clamped <= span.end) {
      return { node: span.node, offset: clamped - span.start }
    }
  }

  const last = spans[spans.length - 1]
  return { node: last.node, offset: last.node.textContent?.length ?? 0 }
}

function offsetsToRange(
  start: number,
  end: number,
  spans: TextSpan[],
  totalLength: number
) {
  if (start >= end) return null

  const startBoundary = offsetToBoundary(start, spans, totalLength)
  const endBoundary = offsetToBoundary(end, spans, totalLength)

  if (!startBoundary || !endBoundary) return null

  try {
    const range = document.createRange()
    range.setStart(startBoundary.node, startBoundary.offset)
    range.setEnd(endBoundary.node, endBoundary.offset)
    return range.collapsed ? null : range
  } catch {
    return null
  }
}

function buildVisibleSegments(highlights: HighlightEntry[]) {
  if (highlights.length === 0) return [] as Array<{ start: number; end: number; color: ColorKey }>

  const boundaries = Array.from(
    new Set(highlights.flatMap(entry => [entry.start, entry.end]))
  ).sort((a, b) => a - b)

  const segments: Array<{ start: number; end: number; color: ColorKey }> = []

  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const start = boundaries[i]
    const end = boundaries[i + 1]
    if (start === end) continue

    const active = highlights.filter(entry => entry.start < end && start < entry.end)
    if (active.length === 0) continue

    const topLayer = Math.max(...active.map(entry => entry.layer))
    const topEntry = active.find(entry => entry.layer === topLayer)
    if (!topEntry) continue

    const previous = segments[segments.length - 1]
    if (previous && previous.color === topEntry.color && previous.end === start) {
      previous.end = end
    } else {
      segments.push({ start, end, color: topEntry.color })
    }
  }

  return segments
}

interface TextHighlighterProps {
  children: ReactNode
  className?: string
}

export default function TextHighlighter({ children, className = '' }: TextHighlighterProps) {
  const [highlights, setHighlights] = useState<HighlightEntry[]>([])
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuState>({
    show: false,
    x: 0,
    y: 0,
    text: '',
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const highlightsRef = useRef<HighlightEntry[]>([])
  const nextLayerRef = useRef(1)
  const suppressNextClick = useRef(false)
  const instanceIdRef = useRef(`th-${Math.random().toString(36).slice(2, 11)}`)
  const registriesRef = useRef<Record<ColorKey, Highlight | null>>({
    yellow: null,
    green: null,
    pink: null,
  })

  highlightsRef.current = highlights

  const clearSelectionMenu = () => {
    setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
  }

  const getSelectionBounds = () => {
    if (
      selectionMenu.start === undefined ||
      selectionMenu.end === undefined ||
      selectionMenu.start === selectionMenu.end
    ) {
      return null
    }

    return { start: selectionMenu.start, end: selectionMenu.end }
  }

  const applyHighlight = (color: ColorKey) => {
    const bounds = getSelectionBounds()
    if (!bounds) return

    const entry: HighlightEntry = {
      id: createHighlightId(),
      start: bounds.start,
      end: bounds.end,
      color,
      layer: nextLayerRef.current++,
    }

    setHighlights(prev => [...prev, entry])
    window.getSelection()?.removeAllRanges()
    clearSelectionMenu()
  }

  const removeLayerFromSelection = (targetLayer: number, start: number, end: number) => {
    setHighlights(prev =>
      prev.flatMap(entry => {
        if (entry.layer !== targetLayer || !overlaps(entry.start, entry.end, start, end)) {
          return entry
        }

        return subtractInterval(entry.start, entry.end, start, end).map(fragment => ({
          ...entry,
          id: createHighlightId(),
          start: fragment.start,
          end: fragment.end,
        }))
      })
    )
  }

  const removeHighlightFragment = (id: string) => {
    setHighlights(prev => prev.filter(entry => entry.id !== id))
  }

  useEffect(() => {
    if (!isHighlightApiSupported()) return
    ensureHighlightStyles(instanceIdRef.current)

    ;(Object.keys(COLORS) as ColorKey[]).forEach(color => {
      const registry = new Highlight()
      registriesRef.current[color] = registry
      CSS.highlights.set(getRegistryName(instanceIdRef.current, color), registry)
    })

    return () => {
      ;(Object.keys(COLORS) as ColorKey[]).forEach(color => {
        CSS.highlights.delete(getRegistryName(instanceIdRef.current, color))
        registriesRef.current[color] = null
      })
    }
  }, [])

  useEffect(() => {
    if (!isHighlightApiSupported()) return

    ;(Object.keys(COLORS) as ColorKey[]).forEach(color => {
      registriesRef.current[color]?.clear()
    })

    const { spans, totalLength } = collectTextSpans(contentRef.current)
    const visibleSegments = buildVisibleSegments(highlights)

    visibleSegments.forEach(segment => {
      const range = offsetsToRange(segment.start, segment.end, spans, totalLength)
      if (range) registriesRef.current[segment.color]?.add(range)
    })
  }, [highlights])

  useEffect(() => {
    if (!isHighlightApiSupported()) return

    const handleSelection = () => {
      setTimeout(() => {
        const selection = window.getSelection()
        const content = contentRef.current
        const container = containerRef.current

        if (!selection || selection.rangeCount === 0 || !content || !container) {
          clearSelectionMenu()
          return
        }

        const range = selection.getRangeAt(0)
        const selectedText = selection.toString().trim()

        if (!selectedText || !content.contains(range.commonAncestorContainer)) {
          clearSelectionMenu()
          return
        }

        const offsets = rangeToOffsets(content, range)
        if (!offsets) {
          clearSelectionMenu()
          return
        }

        const rect = range.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()

        suppressNextClick.current = true
        setSelectionMenu({
          show: true,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 60,
          text: selectedText,
          start: offsets.start,
          end: offsets.end,
        })
      }, 10)
    }

    const handleClick = (e: MouseEvent) => {
      if ((e.target as Element).closest('.highlight-menu')) return
      if (suppressNextClick.current) {
        suppressNextClick.current = false
        return
      }
      clearSelectionMenu()
    }

    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  useEffect(() => {
    if (!isHighlightApiSupported()) return
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const handleMouseMove = (e: MouseEvent) => {
      const caret = getCaretFromPoint(e.clientX, e.clientY)
      if (!caret) {
        container.style.cursor = ''
        return
      }

      const offset = boundaryToOffset(content, caret.node, caret.offset)
      if (offset === null) {
        container.style.cursor = ''
        return
      }

      const isOver = highlightsRef.current.some(
        entry => entry.start <= offset && offset < entry.end
      )
      container.style.cursor = isOver ? 'pointer' : ''
    }

    container.addEventListener('mousemove', handleMouseMove)
    return () => container.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (!isHighlightApiSupported()) return
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const handleDblClick = (e: MouseEvent) => {
      const caret = getCaretFromPoint(e.clientX, e.clientY)
      if (!caret) return

      const offset = boundaryToOffset(content, caret.node, caret.offset)
      if (offset === null) return

      const visibleEntries = highlightsRef.current.filter(
        entry => entry.start <= offset && offset < entry.end
      )
      if (visibleEntries.length === 0) return

      const topLayer = Math.max(...visibleEntries.map(entry => entry.layer))
      const hit = visibleEntries.find(entry => entry.layer === topLayer)
      if (hit) removeHighlightFragment(hit.id)
    }

    container.addEventListener('dblclick', handleDblClick)
    return () => container.removeEventListener('dblclick', handleDblClick)
  }, [])

  const isSelectionHighlighted = () => {
    const bounds = getSelectionBounds()
    if (!bounds) return false

    return highlightsRef.current.some(entry =>
      overlaps(entry.start, entry.end, bounds.start, bounds.end)
    )
  }

  const handleRemoveSelection = () => {
    const bounds = getSelectionBounds()
    if (!bounds) return

    const overlappingEntries = highlightsRef.current.filter(entry =>
      overlaps(entry.start, entry.end, bounds.start, bounds.end)
    )
    if (overlappingEntries.length === 0) {
      window.getSelection()?.removeAllRanges()
      clearSelectionMenu()
      return
    }

    const topLayer = Math.max(...overlappingEntries.map(entry => entry.layer))
    removeLayerFromSelection(topLayer, bounds.start, bounds.end)
    window.getSelection()?.removeAllRanges()
    clearSelectionMenu()
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-visible select-text ${className}`}
    >
      <div ref={contentRef} className='exam-text-scalable passage-content'>
        {children}
      </div>

      {selectionMenu.show && (
        <div
          className='highlight-menu absolute z-50 flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1 shadow-lg'
          style={{
            left: selectionMenu.x,
            top: selectionMenu.y,
            transform: 'translateX(-50%)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {(Object.keys(COLORS) as ColorKey[]).map(color => (
            <button
              key={color}
              title={`Highlight ${COLORS[color].label}`}
              onClick={e => {
                e.stopPropagation()
                applyHighlight(color)
              }}
              className='h-6 w-6 cursor-pointer rounded-full border border-gray-300 transition-transform hover:scale-110'
              style={{ backgroundColor: COLORS[color].bg }}
            />
          ))}

          {isSelectionHighlighted() && (
            <>
              <div className='mx-1 h-5 w-px bg-gray-200' />
              <Button
                size='sm'
                variant='ghost'
                onClick={e => {
                  e.stopPropagation()
                  handleRemoveSelection()
                }}
                className='h-6 px-2 text-xs text-gray-500 hover:text-red-500'
              >
                ✕ Remove
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
