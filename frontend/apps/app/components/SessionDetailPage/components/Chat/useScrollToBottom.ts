import { useCallback, useEffect, useRef, useState } from 'react'

type Options = {
  threshold?: number
  behavior?: ScrollBehavior
}

export const useScrollToBottom = <T extends HTMLElement>(
  itemsLength: number,
  { threshold = 0, behavior = 'smooth' }: Options = {},
) => {
  const containerRef = useRef<T | null>(null)
  const [locked, setLocked] = useState(false)

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [behavior])

  useEffect(() => {
    if (!locked) scrollToBottom()
  }, [itemsLength])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight
      if (distanceFromBottom > threshold && !locked) setLocked(true)
      if (distanceFromBottom <= threshold && locked) setLocked(false)
    }
    el.addEventListener('scroll', handler)
    return () => el.removeEventListener('scroll', handler)
  }, [locked, threshold])

  return { containerRef, scrollToBottom, locked }
}
