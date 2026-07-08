# Highlight Feature Fix — Design Spec

**Date:** 2026-04-02  
**Status:** Approved  
**Scope:** Replace DOM-mutation-based highlighting with CSS Custom Highlight API

---

## Problem

`TextHighlighter.tsx` currently highlights text by cloning a `Range`, calling
`range.deleteContents()`, wrapping text nodes in `<mark>` elements, then
re-inserting via `range.insertNode()`. This approach:

- Destroys and re-inserts React-managed DOM nodes, breaking Radix UI
  components (RadioGroup, etc.) by stripping synthetic event listeners
- Causes content reordering in inline question types (note-completion,
  sentence-completion, form-completion) because `insertNode` places content
  at the range start position after deletion collapses element boundaries
- Creates layout gaps in multiple-choice questions due to disrupted flex
  containers
- Produces multiple fragmented `<mark>` elements (one per text node) for
  multi-line selections, requiring N double-clicks to remove one logical
  highlight
- Conflicts with React reconciliation: on re-render, React overwrites `<mark>`
  elements inserted into directly-managed text nodes

---

## Solution

Replace all DOM mutation with the **CSS Custom Highlight API**
(`CSS.highlights`). Highlights are stored as `Range` objects registered in
named `Highlight` sets. The browser paints the colour as a native CSS layer —
the DOM is never touched.

---

## Architecture

### State Shape

```typescript
type ColorKey = 'yellow' | 'green' | 'pink'

interface HighlightEntry {
  id: string      // unique per gesture: `highlight-${Date.now()}-${random}`
  range: Range    // cloned Range from the selection
  color: ColorKey
}

const COLORS: Record<ColorKey, { bg: string; label: string }> = {
  yellow: { bg: '#FEF3C7', label: 'Yellow' },
  green:  { bg: '#D1FAE5', label: 'Green'  },
  pink:   { bg: '#FCE7F3', label: 'Pink'   },
}
```

### CSS Highlight Registries

Multiple `TextHighlighter` instances exist on the same page (e.g. passage +
question blocks in ReadingSection). Registries must be **module-level
singletons** — defined once outside the component — so that later mounts do
not overwrite and silently drop ranges registered by earlier instances.

```typescript
// module level — outside the component
const registries: Record<ColorKey, Highlight> = {
  yellow: new Highlight(),
  green:  new Highlight(),
  pink:   new Highlight(),
}
if (typeof CSS !== 'undefined' && CSS.highlights) {
  CSS.highlights.set('highlight-yellow', registries.yellow)
  CSS.highlights.set('highlight-green',  registries.green)
  CSS.highlights.set('highlight-pink',   registries.pink)
}
```

Each instance adds/removes only its own ranges from the shared objects.
On unmount, each instance cleans up only its own ranges — the `Highlight`
objects themselves remain registered for other live instances.

Global CSS (added to `app/globals.css`):

```css
::highlight(highlight-yellow) { background-color: #FEF3C7; }
::highlight(highlight-green)  { background-color: #D1FAE5; }
::highlight(highlight-pink)   { background-color: #FCE7F3; }
```

### Adding a Highlight

```typescript
const applyHighlight = (color: ColorKey) => {
  if (!selectionMenu.range) return
  const entry: HighlightEntry = {
    id: `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    range: selectionMenu.range, // already cloned at selection time
    color,
  }
  registries[color].add(entry.range)
  setHighlights(prev => [...prev, entry])
  setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
  window.getSelection()?.removeAllRanges()
}
```

### Removing a Highlight

```typescript
const removeHighlight = (id: string) => {
  const entry = highlights.find(h => h.id === id)
  if (!entry) return
  registries[entry.color].delete(entry.range)
  setHighlights(prev => prev.filter(h => h.id !== id))
}
```

### Cleanup on Unmount

The cleanup effect must use a ref so it only fires on unmount, not on every
highlights state change (which would delete ranges while the component is
still alive):

```typescript
const highlightsRef = useRef<HighlightEntry[]>([])
highlightsRef.current = highlights  // keep ref in sync on every render

useEffect(() => {
  return () => {
    // runs only on unmount — cleans up this instance's ranges only
    highlightsRef.current.forEach(h => registries[h.color].delete(h.range))
  }
}, []) // empty deps — intentional
```

This prevents ghost highlights persisting in the CSS registry when the
component unmounts (e.g. when `forceRerender` key changes in ListeningSection).

---

## Interaction Model

### Selection Detection (`mouseup`)

Unchanged from current implementation:
- `window.getSelection()` → validate non-empty, within container
- `range.cloneRange()` stored in `selectionMenu` state
- Menu position calculated from `range.getBoundingClientRect()`
- Guard: `selection.toString().trim().length === 0` → no menu

### Selection Menu

Replaces the single "Highlight" button with one button per color plus a
conditional "Remove" button:

```
┌──────────────────────────────────┐
│  🟡  🟢  🌸  │  ✕ Remove        │
└──────────────────────────────────┘
```

- Color buttons always shown when text is selected
- "Remove" button shown only when the selection is entirely within existing
  highlights (checked by testing if every point of the selection falls inside
  a stored range)
- Clicking a color → `applyHighlight(color)`
- Clicking Remove → remove all entries whose ranges intersect the selection

### Cursor Pointer on Hover (`mousemove`)

Since `::highlight()` does not support `cursor` CSS property:

```typescript
const handleMouseMove = (e: MouseEvent) => {
  const caret = document.caretRangeFromPoint?.(e.clientX, e.clientY)
            ?? getCaretPositionFallback(e.clientX, e.clientY) // Firefox
  if (!caret) return
  const isOver = highlights.some(h =>
    h.range.isPointInRange(caret.startContainer, caret.startOffset)
  )
  if (containerRef.current) {
    containerRef.current.style.cursor = isOver ? 'pointer' : ''
  }
}
```

Firefox uses `document.caretPositionFromPoint` which returns a
`CaretPosition` (not a `Range`). A small cross-browser helper normalises both.

### Double-Click Removal (`dblclick`)

```typescript
const handleDoubleClick = (e: MouseEvent) => {
  const caret = document.caretRangeFromPoint?.(e.clientX, e.clientY)
            ?? getCaretPositionFallback(e.clientX, e.clientY)
  if (!caret) return
  const hit = highlights.find(h =>
    h.range.isPointInRange(caret.startContainer, caret.startOffset)
  )
  if (hit) removeHighlight(hit.id)
}
```

---

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Re-highlight over existing highlight | New range added alongside existing. CSS API handles overlap natively — last registered color paints on top. No nesting. |
| Multi-line selection (e.g. question + all options) | One `Range` = one `HighlightEntry`. Double-click anywhere in range removes the whole thing. |
| Whitespace-only selection | `selection.toString().trim() === ''` guard prevents menu showing. |
| Cross-container selection | `commonAncestorContainer` outside `containerRef` → `contains()` fails → no menu. |
| Component unmount (forceRerender key change) | `useEffect` cleanup deletes all owned ranges from registries. |
| Overlapping ranges from different colors | Both registered; visually the later-added color shows on top. |
| Browser without CSS Highlight API support | `typeof CSS !== 'undefined' && 'highlights' in CSS` checked on mount. If false → highlight feature silently disabled (menu never shown). |

---

## File Changes

### `components/exam/TextHighlighter.tsx` — full rewrite
Complete replacement of DOM-mutation approach with CSS Highlight API.
Props interface unchanged: `{ children: ReactNode, className?: string }`.

### `components/exam/EnhancedTextHighlighter.tsx` — deleted
Unused dead file.

### `components/exam/reading/SummaryCompletion.tsx` — 1 line
```tsx
// before
{part}

// after
<span dangerouslySetInnerHTML={{ __html: part }} />
```
Prevents React reconciliation from overwriting text content on re-render
(defensive, not strictly needed with CSS API but correct regardless).

### `app/globals.css` — 3 lines added
```css
::highlight(highlight-yellow) { background-color: #FEF3C7; }
::highlight(highlight-green)  { background-color: #D1FAE5; }
::highlight(highlight-pink)   { background-color: #FCE7F3; }
```

### No changes to:
- `QuestionBlockRenderer.tsx`
- `ReadingSection.tsx`
- `ListeningSection.tsx`
- Any question type component
- `utils/highlightAsBold.tsx`

---

## What This Fixes

| Bug | Root cause | Fixed by |
|---|---|---|
| Multiple lines highlighted simultaneously | `cloneContents` copies entire subtree | CSS API — no DOM cloning |
| Position switching in inline questions | `deleteContents` + `insertNode` reorders nodes | CSS API — no deletion |
| Spacing gaps in multiple-choice | DOM surgery disrupts flex containers | CSS API — layout untouched |
| Radio/select components stop working | React event listeners stripped on re-insert | CSS API — DOM never touched |
| Multi-mark fragmentation on multi-line select | One mark per text node | One Range per gesture |
| Highlights lost on React re-render | `<mark>` overwritten by reconciliation | CSS API — no DOM marks |
