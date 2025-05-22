'use client'
import type { FC, KeyboardEvent, MouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MentionIcon } from './MentionIcon'
import styles from './MentionSuggestor.module.css'
import type { MentionSuggestorProps } from './types'
import { getQuery, renderHighlightedLabel } from './utils'

const DEFAULT_NO_ITEMS_MESSAGE = 'No items found'

// Re-export MentionCandidate type for backward compatibility
export type { MentionCandidate } from './types'

export const MentionSuggestor: FC<MentionSuggestorProps> = ({
  trigger,
  input,
  caret,
  candidates,
  noItemsMessage = DEFAULT_NO_ITEMS_MESSAGE,
  onSelect,
  onClose,
  visible,
  className,
  filter,
  onInputProps,
  maxItems,
}) => {
  // Manage the index of the currently highlighted item
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  // Reference to the list element
  const listRef = useRef<HTMLDivElement>(null)

  // Compute filtered candidates based on query
  const query = useMemo(
    () => getQuery(input, caret, trigger),
    [input, caret, trigger],
  )

  const filtered = useMemo(() => {
    const list = candidates.filter((c) =>
      filter
        ? filter(query, c)
        : c.label.toLowerCase().includes(query.toLowerCase()),
    )
    // Apply maxItems limit if specified
    return maxItems ? list.slice(0, maxItems) : list
  }, [candidates, filter, query, maxItems])

  // Reset the highlighted index when the query changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: query is needed to reset the highlighted index when the query changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!visible) return

      // Always allow normal character input (don't interfere with typing after @)
      if (/^[a-zA-Z0-9-_]$/.test(e.key)) {
        return // Process character input normally
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault() // Prevent cursor movement
          setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault() // Prevent cursor movement
          setHighlightedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          // Only process if there are items to select
          if (filtered.length > 0) {
            e.preventDefault() // Prevent form submission
            onSelect(filtered[highlightedIndex], true)
          }
          break
        case 'Escape':
          onClose?.()
          break
        default:
          // Process other keys normally
          break
      }
    },
    [filtered, highlightedIndex, onClose, onSelect, visible],
  )

  // Pass keyboard event handling to the parent component
  useEffect(() => {
    if (typeof onInputProps === 'function') {
      onInputProps({
        id: 'mention-suggestor-input',
        onKeyDown: handleKeyDown,
      })
    }
  }, [onInputProps, handleKeyDown])

  // Scroll to make the highlighted item visible when it changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: highlightedIndex is needed to scroll to the highlighted item when it changes
  useEffect(() => {
    if (!visible || !listRef.current) return

    // Use a small timeout to wait for DOM updates
    const timeoutId = setTimeout(() => {
      const active = listRef.current?.querySelector('[aria-selected="true"]')
      if (active) (active as HTMLElement).scrollIntoView({ block: 'nearest' })
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [visible, highlightedIndex])

  // Don't display anything if not visible
  if (!visible) return null

  return (
    <div
      ref={listRef}
      className={className || styles.suggestor}
      aria-label="Mention suggestions"
      tabIndex={-1} // Make focusable
      style={{
        minWidth: 200,
        maxWidth: 400,
        maxHeight: 300, // Increased from 200 to 300 to show more items
        overflowY: 'auto',
      }}
    >
      {filtered.length === 0 ? (
        <div className={styles.emptyMessage} aria-disabled="true">
          {noItemsMessage}
        </div>
      ) : (
        filtered.map((item, i) => (
          <div
            key={item.id}
            className={styles.suggestorItem}
            aria-selected={highlightedIndex === i}
            onMouseDown={(e: MouseEvent) => {
              // Prevent textarea blur
              e.preventDefault()
              onSelect(item, false)
            }}
            onMouseEnter={() => setHighlightedIndex(i)}
          >
            <span className={styles.icon}>
              <MentionIcon item={item} />
            </span>
            <span className={styles.label}>
              {(() => {
                const result = renderHighlightedLabel(item.label, query)
                return typeof result === 'string' ? (
                  result
                ) : (
                  <>
                    {result.before}
                    <span className={styles.highlight}>{result.match}</span>
                    {result.after}
                  </>
                )
              })()}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
