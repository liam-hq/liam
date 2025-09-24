'use client'

import {
  type FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import styles from './ArgumentsDisplay.module.css'
import { SyntaxHighlightedLine } from './SyntaxHighlightedLine'
import { formatArguments } from './utils/formatArguments'

// Animation timing constants
const LINE_ADD_INTERVAL_MS = 300
const ANIMATION_DELAY_PER_INDEX_MS = 50
const ANIMATION_COMPLETE_DELAY_MS = 100
const ANIMATION_DURATION_MS = 300
type Props = {
  args: unknown
  isAnimated: boolean
  onLineAdded: () => void
  onReady: () => void
  isExpanded: boolean
  onOverflowDetected: (hasOverflow: boolean) => void
  toolName: string
  onAnimationComplete: () => void
}

export const ArgumentsDisplay: FC<Props> = ({
  args,
  isAnimated,
  onLineAdded,
  onReady,
  isExpanded,
  onOverflowDetected,
  toolName,
  onAnimationComplete,
}) => {
  // Format arguments into display lines
  const displayLines = useMemo(() => formatArguments(args), [args])

  // Initialize state - for non-animated content, show all lines immediately
  const [visibleLines, setVisibleLines] = useState<string[]>(() => {
    // If not animated, show all lines immediately
    if (!isAnimated) {
      return displayLines
    }
    // For animated content, start with empty array
    return []
  })
  const [currentIndex, setCurrentIndex] = useState(() => {
    // If not animated, set index to the end
    if (!isAnimated) {
      return displayLines.length
    }
    // For animated content, start at 0
    return 0
  })
  // For non-animated content, start as ready immediately
  const [isReady, setIsReady] = useState(!isAnimated)

  // Remove internal expand state - now controlled by parent

  // Scroll management for gradient overlays
  const containerRef = useRef<HTMLDivElement>(null)
  const [showTopGradient, setShowTopGradient] = useState(false)
  const [showBottomGradient, setShowBottomGradient] = useState(false)

  // Extract easing function
  const calculateEaseProgress = useCallback((progress: number): number => {
    return progress < 0.5
      ? 2 * progress * progress
      : 1 - (-2 * progress + 2) ** 2 / 2
  }, [])

  // Extract smooth scroll animation
  const animateScroll = useCallback(
    (element: HTMLElement, targetScroll: number, duration: number) => {
      const startTime = performance.now()
      const initialScrollTop = element.scrollTop
      const scrollDistance = targetScroll - initialScrollTop

      const scrollStep = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = calculateEaseProgress(progress)

        element.scrollTop = initialScrollTop + scrollDistance * easeProgress

        if (progress < 1) {
          requestAnimationFrame(scrollStep)
        }
      }

      requestAnimationFrame(scrollStep)
    },
    [calculateEaseProgress],
  )

  // Wait for all lines to be calculated before starting animation
  useEffect(() => {
    if (isAnimated && displayLines.length > 0 && !isReady) {
      // Minimal delay to ensure DOM is ready (reduce from 100ms to 50ms)
      const readyTimer = setTimeout(() => {
        setIsReady(true)
        onReady()
      }, ANIMATION_DELAY_PER_INDEX_MS)
      return () => clearTimeout(readyTimer)
    }
    return undefined
  }, [displayLines.length, isAnimated, isReady, onReady])

  // Always sync visibleLines with displayLines when not animated
  useEffect(() => {
    if (!isAnimated && displayLines.length > 0) {
      setVisibleLines(displayLines)
      setCurrentIndex(displayLines.length)
    }
  }, [displayLines, isAnimated])

  useEffect(() => {
    // Start animation only after ready
    if (isAnimated && isReady && currentIndex < displayLines.length) {
      const timer = setTimeout(() => {
        const nextLine = displayLines[currentIndex]
        if (nextLine) {
          setVisibleLines((prev) => [...prev, nextLine])
          setCurrentIndex((prev) => prev + 1)

          // Scroll synchronously with CSS animation
          // Continuously adjust scroll during the animation period
          const animationDuration = ANIMATION_DURATION_MS // CSS fadeIn duration
          const animationDelay = currentIndex * ANIMATION_DELAY_PER_INDEX_MS // CSS animation delay

          // Start scrolling after the CSS animation delay
          setTimeout(() => {
            if (containerRef.current && !isExpanded) {
              const element = containerRef.current
              const { scrollHeight, clientHeight } = element

              // Only animate if scrolling is needed
              if (scrollHeight > clientHeight) {
                const targetScroll = scrollHeight - clientHeight
                animateScroll(element, targetScroll, animationDuration)
              }
            }
          }, animationDelay) // Wait for CSS animation delay

          // Notify parent for potential scrolling
          onLineAdded()

          // Check if this was the last line
          if (currentIndex + 1 === displayLines.length) {
            // Notify that animation is complete
            setTimeout(() => {
              onAnimationComplete()
            }, ANIMATION_COMPLETE_DELAY_MS) // Small delay to ensure smooth visual completion
          }
        }
      }, LINE_ADD_INTERVAL_MS) // Add one line every 300ms

      return () => clearTimeout(timer)
    }

    // When animation completes, ensure we're at the bottom
    if (
      isReady &&
      currentIndex === displayLines.length &&
      displayLines.length > 0
    ) {
      // Add a small delay to ensure DOM is fully updated
      setTimeout(() => {
        if (containerRef.current) {
          const element = containerRef.current
          const { scrollHeight, clientHeight } = element

          // Force scroll to the absolute bottom using scrollHeight
          if (scrollHeight > clientHeight) {
            element.scrollTop = scrollHeight
          }
        }
      }, ANIMATION_COMPLETE_DELAY_MS)
    }

    return undefined
  }, [
    isAnimated,
    isReady,
    currentIndex,
    displayLines,
    onLineAdded,
    isExpanded,
    onAnimationComplete,
    animateScroll,
  ])

  // Immediately notify ready for non-animated content
  useEffect(() => {
    if (!isAnimated && onReady) {
      onReady()
    }
  }, [isAnimated, onReady])

  // Track if content was ever scrollable
  const [wasScrollable, setWasScrollable] = useState(false)
  // Remove hover state - button is now in parent

  // Helper to update gradient visibility
  const updateGradients = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      const scrollable = scrollHeight > clientHeight
      if (scrollable) {
        setShowTopGradient(scrollTop > 5)
        setShowBottomGradient(scrollTop < scrollHeight - clientHeight - 5)
      } else {
        setShowTopGradient(false)
        setShowBottomGradient(false)
      }
      return scrollable
    },
    [],
  )

  // Helper to track scrollable state
  const trackScrollableState = useCallback(
    (scrollable: boolean) => {
      if (scrollable && !isExpanded) {
        setWasScrollable(true)
      }
    },
    [isExpanded],
  )

  // Helper to notify overflow detection
  const notifyOverflowIfNeeded = useCallback(
    (scrollable: boolean) => {
      const shouldNotify = !isAnimated || visibleLines.length > 3
      if (shouldNotify) {
        onOverflowDetected(wasScrollable || scrollable)
      }
    },
    [onOverflowDetected, isAnimated, visibleLines.length, wasScrollable],
  )

  // Handle scroll events to show/hide gradients
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const scrollable = updateGradients(scrollTop, scrollHeight, clientHeight)

    trackScrollableState(scrollable)
    notifyOverflowIfNeeded(scrollable)
  }, [updateGradients, trackScrollableState, notifyOverflowIfNeeded])

  // Re-check scroll when expand state changes
  useEffect(() => {
    requestAnimationFrame(() => {
      handleScroll()
    })
  }, [handleScroll])

  // Setup scroll listener
  useEffect(() => {
    const element = containerRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)

      // Check scroll state after DOM update
      requestAnimationFrame(() => {
        handleScroll()
      })

      return () => {
        element.removeEventListener('scroll', handleScroll)
      }
    }
    return undefined
  }, [handleScroll]) // Re-check when content or expand state changes

  // Initial check for overflow after DOM layout
  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const scrollable = updateGradients(scrollTop, scrollHeight, clientHeight)

      trackScrollableState(scrollable)
      notifyOverflowIfNeeded(scrollable)
    }

    // Check immediately and after any potential layout changes
    checkOverflow()

    // Also check after a small delay to handle async content loading
    const timer = setTimeout(checkOverflow, 100)
    return () => clearTimeout(timer)
  }, [updateGradients, trackScrollableState, notifyOverflowIfNeeded]) // Re-check when key properties change

  // Don't show anything during preparation phase (only for animated content)
  // For non-animated content, always show
  // Show immediately for running tools to avoid hiding arguments
  // Keep empty check to avoid rendering empty content
  if (isAnimated && !isReady && displayLines.length === 0) {
    return null
  }

  // Apply height limit for running animation effect (except Route to Agent)
  const isRouteToAgent = toolName === 'routeToAgent'

  const containerStyle: React.CSSProperties = isExpanded
    ? { maxHeight: '600px', overflowY: 'auto' } // Large but defined max-height for smooth animation
    : isRouteToAgent
      ? { overflowY: 'auto' } // No limit for Route to Agent (short content)
      : { maxHeight: '100px', overflowY: 'auto' } // 100px limit for running animation effect

  return (
    <div className={styles.wrapper} data-expanded={isExpanded}>
      {showTopGradient && <div className={styles.gradientTop} />}
      {showBottomGradient && <div className={styles.gradientBottom} />}
      <div
        className={styles.container}
        ref={containerRef}
        style={containerStyle}
      >
        {visibleLines.map((line, index) => (
          <SyntaxHighlightedLine
            key={`${index}-${line}`}
            line={line}
            isAnimated={isAnimated}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
