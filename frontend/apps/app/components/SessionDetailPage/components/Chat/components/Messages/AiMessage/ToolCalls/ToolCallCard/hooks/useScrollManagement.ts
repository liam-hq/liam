import { useEffect, useRef } from 'react'
import type { useExpandState } from './useExpandState'

type Status = 'pending' | 'running' | 'completed' | 'error'

export const useScrollManagement = (
  expandState: ReturnType<typeof useExpandState>,
  status: Status,
  result: string,
) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const resultContentRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  const handleLineAdded = () => {
    const isRunning = status === 'pending' || status === 'running'
    if (contentRef.current && !expandState.isCollapsed && isRunning) {
      // Cancel any existing animation frame
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      rafRef.current = requestAnimationFrame(() => {
        if (contentRef.current) {
          const element = contentRef.current
          const { scrollHeight, clientHeight } = element
          if (scrollHeight > clientHeight) {
            element.scrollTop = element.scrollHeight
          }
        }
        rafRef.current = null
      })
    }
  }

  const handleArgumentsOverflow = (hasOverflow: boolean) => {
    expandState.setNeedsExpandButton(hasOverflow)
  }

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (resultContentRef.current && result && status === 'completed') {
      const element = resultContentRef.current
      const hasOverflow = element.scrollHeight > 100
      expandState.setNeedsResultExpandButton(hasOverflow)
      expandState.setIsResultScrollable(
        hasOverflow && !expandState.isResultExpanded,
      )
    }
  }, [result, status, expandState.isResultExpanded, expandState])

  return {
    contentRef,
    resultContentRef,
    handleLineAdded,
    handleArgumentsOverflow,
  }
}
