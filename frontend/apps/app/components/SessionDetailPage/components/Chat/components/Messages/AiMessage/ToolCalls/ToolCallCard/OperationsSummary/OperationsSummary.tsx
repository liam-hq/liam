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
  const [currentIndex, setCurrentIndex] = useState(
    isAnimated ? 0 : summaryLines.length,
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasStarted = useRef(false)

  useEffect(() => {
    // Skip animation if not animated
    if (!isAnimated) {
      setDisplayedLines(summaryLines)
      setCurrentIndex(summaryLines.length)
      return
    }

    // Start animation only once
    if (!hasStarted.current && summaryLines.length > 0) {
      hasStarted.current = true
    }

    if (hasStarted.current && currentIndex < summaryLines.length) {
      const timer = setTimeout(() => {
        const nextLine = summaryLines[currentIndex]
        if (nextLine) {
          setDisplayedLines((prev) => [...prev, nextLine])
          setCurrentIndex((prev) => prev + 1)
        }
      }, 200) // Add one line every 200ms (slower for better readability)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [currentIndex, summaryLines, isAnimated])

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
