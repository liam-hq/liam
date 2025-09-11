'use client'

import {
  type FC,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import styles from './OperationsSummary.module.css'
import { parseOperations } from './utils/parseOperations'

type Operation = {
  op?: string
  type?: string
  path?: string
  value?: unknown
}

type Props = {
  operations: Operation[]
  isAnimated?: boolean
}

export const OperationsSummary: FC<Props> = ({
  operations,
  isAnimated = true,
}) => {
  // Memoize parsed operations to prevent re-parsing
  const summaryLines = useMemo(() => parseOperations(operations), [operations])

  // Initialize state - show all lines immediately if not animated
  const [displayedLines, setDisplayedLines] = useState<string[]>(() =>
    isAnimated ? [] : summaryLines,
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const animationRunning = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Reset state when operations or isAnimated changes
  useEffect(() => {
    // Clear any active timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // Stop animation
    animationRunning.current = false

    // Reset state based on isAnimated flag
    if (isAnimated) {
      setDisplayedLines([])
    } else {
      setDisplayedLines(summaryLines)
    }
  }, [summaryLines, isAnimated])

  // Single controlled animation loop
  useEffect(() => {
    // Skip animation if not animated or already running
    if (!isAnimated || animationRunning.current || summaryLines.length === 0) {
      return
    }

    // Start animation
    animationRunning.current = true
    let currentIndex = 0

    const animateNextLine = () => {
      if (currentIndex < summaryLines.length && animationRunning.current) {
        const nextLine = summaryLines[currentIndex]
        if (nextLine) {
          setDisplayedLines((prev) => [...prev, nextLine])
          currentIndex++

          // Schedule next line
          timerRef.current = setTimeout(animateNextLine, 200)
        }
      } else {
        // Animation complete
        animationRunning.current = false
        timerRef.current = null
      }
    }

    // Start the animation
    timerRef.current = setTimeout(animateNextLine, 200)

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      animationRunning.current = false
    }
  }, [summaryLines, isAnimated])

  useLayoutEffect(() => {
    // Auto-scroll only when animated and when new lines are added
    if (scrollRef.current && isAnimated) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [isAnimated])

  return (
    <div className={styles.container} ref={scrollRef}>
      {displayedLines.map((line, index) => (
        <div
          key={`${index}-${line}`}
          className={styles.line}
          style={
            isAnimated
              ? {
                  animationDelay: `${index * 0.05}s`,
                }
              : undefined
          }
        >
          {line}
        </div>
      ))}
    </div>
  )
}
