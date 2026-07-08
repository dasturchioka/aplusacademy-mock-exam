# Highlight Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the DOM-mutation-based `TextHighlighter` with the CSS Custom Highlight API so that highlighting never corrupts React-managed DOM across all question types.

**Architecture:** Module-level `Highlight` singletons per color are registered with `CSS.highlights` once; each `TextHighlighter` instance stores its own `HighlightEntry[]` in React state and adds/removes `Range` objects from those singletons. No DOM nodes are ever created, moved, or deleted — the browser paints highlight colours as a native CSS layer.

**Tech Stack:** Next.js 14, React, TypeScript, CSS Custom Highlight API (`CSS.highlights`), Tailwind CSS, shadcn/ui Button

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/globals.css` | Modify | Add `::highlight()` CSS rules |
| `utils/highlightUtils.ts` | Create | Browser support check + cross-browser caret helper |
| `components/exam/TextHighlighter.tsx` | Rewrite | CSS Highlight API component |
| `components/exam/reading/SummaryCompletion.tsx` | Modify (1 line) | Prevent React reconciliation overwriting text nodes |
| `components/exam/EnhancedTextHighlighter.tsx` | Delete | Unused dead file |

---

## Task 1: Add `::highlight` CSS rules

**Files:**
- Modify: `app/globals.css` (append after line 225)

- [ ] **Step 1: Add the three `::highlight` rules to `app/globals.css`**

Append at the very end of the file:

```css
/* CSS Custom Highlight API — text highlighting in exam sections */
::highlight(highlight-yellow) { background-color: #FEF3C7; }
::highlight(highlight-green)  { background-color: #D1FAE5; }
::highlight(highlight-pink)   { background-color: #FCE7F3; }
```

- [ ] **Step 2: Verify the file ends correctly**

Run: `tail -5 app/globals.css`

Expected output:
```
/* CSS Custom Highlight API — text highlighting in exam sections */
::highlight(highlight-yellow) { background-color: #FEF3C7; }
::highlight(highlight-green)  { background-color: #D1FAE5; }
::highlight(highlight-pink)   { background-color: #FCE7F3; }
```

- [ ] **Step 3: TypeScript check passes (CSS file change only)**

Run: `npx tsc --noEmit`

Expected: no errors related to this change.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: add CSS Custom Highlight API rules for exam text highlighting"
```

---

## Task 2: Create `utils/highlightUtils.ts`

**Files:**
- Create: `utils/highlightUtils.ts`

- [ ] **Step 1: Create the file with both exported functions**

Create `utils/highlightUtils.ts` with this exact content:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript accepts the file**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add utils/highlightUtils.ts
git commit -m "feat: add CSS Highlight API browser support utilities"
```

---

## Task 3: Rewrite `components/exam/TextHighlighter.tsx`

**Files:**
- Rewrite: `components/exam/TextHighlighter.tsx`

This is the main task. Write the file in the sub-steps below, then verify and commit once at the end.

- [ ] **Step 1: Replace the entire file contents**

Write `components/exam/TextHighlighter.tsx` with this exact content:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { getCaretFromPoint, isHighlightApiSupported } from '@/utils/highlightUtils'
import { ReactNode, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ColorKey = 'yellow' | 'green' | 'pink'

interface HighlightEntry {
  id: string
  range: Range
  color: ColorKey
}

const COLORS: Record<ColorKey, { bg: string; label: string }> = {
  yellow: { bg: '#FEF3C7', label: 'Yellow' },
  green:  { bg: '#D1FAE5', label: 'Green'  },
  pink:   { bg: '#FCE7F3', label: 'Pink'   },
}

// ─── Module-level CSS Highlight registries (singletons) ──────────────────────
//
// Defined outside the component so multiple TextHighlighter instances on the
// same page share the same Highlight objects. Each instance manages its own
// HighlightEntry[] in state and cleans up only its own ranges on unmount.

const registries: Record<ColorKey, Highlight | null> = {
  yellow: null,
  green:  null,
  pink:   null,
}

if (isHighlightApiSupported()) {
  ;(Object.keys(COLORS) as ColorKey[]).forEach(key => {
    const h = new Highlight()
    registries[key] = h
    CSS.highlights.set(`highlight-${key}`, h)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TextHighlighterProps {
  children: ReactNode
  className?: string
}

export default function TextHighlighter({ children, className = '' }: TextHighlighterProps) {
  const [highlights, setHighlights] = useState<HighlightEntry[]>([])
  const [selectionMenu, setSelectionMenu] = useState<{
    show: boolean
    x: number
    y: number
    text: string
    range?: Range
  }>({ show: false, x: 0, y: 0, text: '' })

  const containerRef = useRef<HTMLDivElement>(null)

  // Keep a ref in sync so event handlers and the cleanup effect always read
  // the latest highlights without stale closure issues.
  const highlightsRef = useRef<HighlightEntry[]>([])
  highlightsRef.current = highlights

  // ── Apply highlight ──────────────────────────────────────────────────────────

  const applyHighlight = (color: ColorKey) => {
    if (!selectionMenu.range || !registries[color]) return
    const id = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const entry: HighlightEntry = { id, range: selectionMenu.range, color }
    registries[color]!.add(entry.range)
    setHighlights(prev => [...prev, entry])
    window.getSelection()?.removeAllRanges()
    setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
  }

  // ── Remove highlight ─────────────────────────────────────────────────────────

  const removeHighlight = (id: string) => {
    const entry = highlightsRef.current.find(h => h.id === id)
    if (!entry || !registries[entry.color]) return
    registries[entry.color]!.delete(entry.range)
    setHighlights(prev => prev.filter(h => h.id !== id))
  }

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  // Empty deps — intentional. The ref always has the latest highlights so we
  // never need to re-register this effect. Re-registering would run the cleanup
  // on every highlights change, prematurely deleting ranges from the registry.

  useEffect(() => {
    return () => {
      highlightsRef.current.forEach(h => {
        registries[h.color]?.delete(h.range)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Selection detection (mouseup) ─────────────────────────────────────────────

  useEffect(() => {
    if (!isHighlightApiSupported()) return

    const handleSelection = () => {
      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) {
          setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
          return
        }

        const range = selection.getRangeAt(0)
        const selectedText = selection.toString().trim()

        if (
          !selectedText ||
          !containerRef.current?.contains(range.commonAncestorContainer)
        ) {
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
      if ((e.target as Element).closest('.highlight-menu')) return
      setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
    }

    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  // ── Cursor pointer on hover (mousemove) ───────────────────────────────────────
  // ::highlight() does not support the cursor CSS property, so we toggle it via JS.

  useEffect(() => {
    if (!isHighlightApiSupported()) return
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const caret = getCaretFromPoint(e.clientX, e.clientY)
      if (!caret) {
        container.style.cursor = ''
        return
      }
      const isOver = highlightsRef.current.some(h => {
        try {
          return h.range.isPointInRange(caret.node, caret.offset)
        } catch {
          return false
        }
      })
      container.style.cursor = isOver ? 'pointer' : ''
    }

    container.addEventListener('mousemove', handleMouseMove)
    return () => container.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // ── Double-click removal (dblclick) ───────────────────────────────────────────

  useEffect(() => {
    if (!isHighlightApiSupported()) return
    const container = containerRef.current
    if (!container) return

    const handleDblClick = (e: MouseEvent) => {
      const caret = getCaretFromPoint(e.clientX, e.clientY)
      if (!caret) return
      const hit = highlightsRef.current.find(h => {
        try {
          return h.range.isPointInRange(caret.node, caret.offset)
        } catch {
          return false
        }
      })
      if (hit) removeHighlight(hit.id)
    }

    container.addEventListener('dblclick', handleDblClick)
    return () => container.removeEventListener('dblclick', handleDblClick)
  }, [])

  // ── Helpers for the Remove button ─────────────────────────────────────────────

  const isSelectionFullyHighlighted = (): boolean => {
    if (!selectionMenu.range || highlightsRef.current.length === 0) return false
    const { range } = selectionMenu
    try {
      const startCovered = highlightsRef.current.some(h => {
        try { return h.range.isPointInRange(range.startContainer, range.startOffset) }
        catch { return false }
      })
      const endOffset = range.endOffset > 0 ? range.endOffset - 1 : 0
      const endCovered = highlightsRef.current.some(h => {
        try { return h.range.isPointInRange(range.endContainer, endOffset) }
        catch { return false }
      })
      return startCovered && endCovered
    } catch {
      return false
    }
  }

  const handleRemoveSelection = () => {
    if (!selectionMenu.range) return
    const sel = selectionMenu.range
    const toRemove = highlightsRef.current.filter(h => {
      try {
        return (
          sel.isPointInRange(h.range.startContainer, h.range.startOffset) ||
          sel.isPointInRange(h.range.endContainer, h.range.endOffset) ||
          h.range.isPointInRange(sel.startContainer, sel.startOffset)
        )
      } catch {
        return false
      }
    })
    toRemove.forEach(h => removeHighlight(h.id))
    window.getSelection()?.removeAllRanges()
    setSelectionMenu({ show: false, x: 0, y: 0, text: '' })
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-visible select-text ${className}`}
    >
      <div className='exam-text-scalable passage-content'>{children}</div>

      {selectionMenu.show && (
        <div
          className='highlight-menu absolute z-50 flex items-center gap-1 bg-white border border-gray-300 rounded-lg shadow-lg p-1'
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
              className='w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform cursor-pointer'
              style={{ backgroundColor: COLORS[color].bg }}
            />
          ))}

          {isSelectionFullyHighlighted() && (
            <>
              <div className='w-px h-5 bg-gray-200 mx-1' />
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: no errors. If you see `Cannot find name 'Highlight'`, add `/// <reference lib="dom" />` at the top of `utils/highlightUtils.ts`. The `Highlight` constructor is part of the DOM lib in TypeScript 5.x — it should be available.

- [ ] **Step 3: Start the dev server and open a Reading or Listening exam page**

Run: `npm run dev`

Open the exam page in Chrome/Edge/Safari. Select any text in a passage or question block.

Expected: a small floating menu appears above the selection with three coloured circles (yellow, green, pink).

- [ ] **Step 4: Verify highlight apply**

Click the yellow circle in the menu.

Expected:
- Selected text is painted with yellow background
- No DOM nodes are added (verify in DevTools Elements panel — no `<mark>` tags appear)
- Menu closes
- Interactive elements (radio buttons, inputs) in the same TextHighlighter still work normally

- [ ] **Step 5: Verify multi-line highlight in MultipleChoice**

Select from the question text down through two or three option labels.

Expected:
- All selected text shows yellow highlight
- Radio buttons remain clickable
- No layout gaps between option rows
- No content repositioning

- [ ] **Step 6: Verify double-click removal**

Double-click on any highlighted text.

Expected: the highlight disappears completely. The cursor changes to a pointer when hovering over highlighted text.

- [ ] **Step 7: Verify FormCompletion / NoteCompletion inline questions**

Select text in a note-completion or form-completion question that spans text on both sides of an inline `<Input>`.

Expected:
- Text on both sides highlights correctly
- The `<Input>` is unaffected (not selected, not moved, still accepts keyboard input)
- No sentence reordering

- [ ] **Step 8: Commit**

```bash
git add components/exam/TextHighlighter.tsx
git commit -m "feat: rewrite TextHighlighter using CSS Custom Highlight API

Replaces DOM-mutation approach (cloneContents/deleteContents/insertNode)
with the CSS Custom Highlight API. Zero DOM changes — highlights are
stored as Range objects registered in module-level Highlight singletons
and painted by the browser as a native CSS layer.

Fixes: multi-line fragmentation, position switching in inline questions,
layout gaps in multiple-choice, interactive elements losing event bindings."
```

---

## Task 4: Fix `SummaryCompletion.tsx`

**Files:**
- Modify: `components/exam/reading/SummaryCompletion.tsx:136-156`

- [ ] **Step 1: Locate the `parts.map` render block**

In `SummaryCompletion.tsx`, find this block (around line 136):

```tsx
<div className='text-base leading-7'>
  {parts.map((part, i) => {
    const showInput = i < questionNumbers.length && text
    const number = questionNumbers[i]

    return (
      <React.Fragment key={i}>
        {part}
        {showInput && (
          <Input ... />
        )}
      </React.Fragment>
    )
  })}
</div>
```

- [ ] **Step 2: Change `{part}` to a `dangerouslySetInnerHTML` span**

Replace only `{part}` with `<span dangerouslySetInnerHTML={{ __html: part }} />`:

```tsx
<div className='text-base leading-7'>
  {parts.map((part, i) => {
    const showInput = i < questionNumbers.length && text
    const number = questionNumbers[i]

    return (
      <React.Fragment key={i}>
        <span dangerouslySetInnerHTML={{ __html: part }} />
        {showInput && (
          <Input
            type='text'
            value={localAnswers[number] || ''}
            onChange={e => handleChange(number, e.target.value)}
            placeholder={`${number}`}
            id={`qn-${number}`}
            className='w-24 inline-block mx-1'
          />
        )}
      </React.Fragment>
    )
  })}
</div>
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Verify SummaryCompletion still renders correctly**

Open a Reading exam page with a summary-completion question. Type in one of the inline inputs.

Expected: the surrounding text does not change or disappear when you type. Any highlights applied to the text persist through typing.

- [ ] **Step 5: Commit**

```bash
git add components/exam/reading/SummaryCompletion.tsx
git commit -m "fix: use dangerouslySetInnerHTML for SummaryCompletion text parts

Prevents React reconciliation from overwriting text node content on
re-render (when user types in inline inputs). Consistent with how
all other question type components render their text content."
```

---

## Task 5: Delete `EnhancedTextHighlighter.tsx`

**Files:**
- Delete: `components/exam/EnhancedTextHighlighter.tsx`

- [ ] **Step 1: Confirm the file is not imported anywhere**

Run: `grep -r "EnhancedTextHighlighter" --include="*.tsx" --include="*.ts" .`

Expected: only the file itself appears (no imports). If any file imports it, update that import to use `TextHighlighter` instead before proceeding.

- [ ] **Step 2: Delete the file**

Run: `git rm components/exam/EnhancedTextHighlighter.tsx`

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

Expected: no errors (no broken imports).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: delete unused EnhancedTextHighlighter component"
```

---

## Final Verification Checklist

After all tasks are complete, manually verify each scenario in the browser:

| Scenario | Expected |
|---|---|
| Select text in Reading passage | Yellow/green/pink colour buttons appear |
| Click yellow | Text turns yellow, no DOM `<mark>` nodes in DevTools |
| Select question + all options in MultipleChoice | All selected text highlights; radio buttons still work |
| Double-click highlighted text | Highlight removed |
| Hover over highlighted text | Cursor changes to pointer |
| Select text that is already highlighted | Menu shows + Remove button |
| Click Remove | Highlight(s) removed |
| NoteCompletion: select text spanning an inline Input | Text highlights on both sides; Input unaffected; no reordering |
| SummaryCompletion: highlight text then type in Input | Highlight persists through typing |
| FlowChart: select text in a node | Text highlights; drag-and-drop zones still work |
| TableCompletion: select text in a cell | Text highlights; inputs in cells still work |
| Multiple TextHighlighter instances on same page | Each manages its own highlights independently |
| Navigate away from exam section | Ghost highlights do not appear when navigating back |
