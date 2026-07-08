'use client'

import { CSSProperties, ElementType, memo } from 'react'

type StableHtmlProps<T extends ElementType = 'span'> = {
  as?: T
  html: string
  className?: string
  style?: CSSProperties
}

function areStylesEqual(
  prev: CSSProperties | undefined,
  next: CSSProperties | undefined
): boolean {
  if (prev === next) return true
  if (!prev || !next) return !prev && !next

  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  if (prevKeys.length !== nextKeys.length) return false

  return prevKeys.every(key => prev[key as keyof CSSProperties] === next[key as keyof CSSProperties])
}

function StableHtmlInner<T extends ElementType = 'span'>({
  as,
  html,
  className,
  style,
}: StableHtmlProps<T>) {
  const Tag = (as || 'span') as ElementType
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />
}

export const StableHtml = memo(
  StableHtmlInner,
  (prev, next) =>
    prev.as === next.as &&
    prev.html === next.html &&
    prev.className === next.className &&
    areStylesEqual(prev.style, next.style)
)
