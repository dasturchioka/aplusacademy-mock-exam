/**
 * Returns true if the CSS Custom Highlight API is available in this browser.
 * Guards against SSR (typeof CSS === 'undefined' on the server).
 */
export function isHighlightApiSupported(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    'highlights' in CSS &&
    typeof Highlight !== 'undefined'
  )
}

/**
 * Cross-browser helper to get the text node and character offset at a screen
 * position. Returns null if the position is not over any text content.
 *
 * Chrome/Edge/Safari use document.caretRangeFromPoint (returns Range).
 * Firefox uses document.caretPositionFromPoint (returns CaretPosition).
 */
export function getCaretFromPoint(
  x: number,
  y: number
): { node: Node; offset: number } | null {
  // Chrome, Edge, Safari
  if ('caretRangeFromPoint' in document) {
    const range = (document as any).caretRangeFromPoint(x, y) as Range | null
    if (!range) return null
    return { node: range.startContainer, offset: range.startOffset }
  }

  // Firefox
  if ('caretPositionFromPoint' in document) {
    const pos = (document as any).caretPositionFromPoint(x, y)
    if (!pos) return null
    return { node: pos.offsetNode, offset: pos.offset }
  }

  return null
}
