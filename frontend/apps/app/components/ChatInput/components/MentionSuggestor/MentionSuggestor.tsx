'use client'

import type { Schema } from '@liam-hq/db-structure'
import {
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import type { MentionItem } from '../../types'
import { HighlightedLabel } from './components/HighlightedLabel'
import { MentionIcon } from './components/MentionIcon'
import styles from './MentionSuggestor.module.css'
import { extractActiveMention } from './utils/extractActiveMention'
import { matchSchemaCandidates } from './utils/matchSchemaCandidates'

const DEFAULT_NO_ITEMS_MESSAGE = 'No items found'

export type MentionSuggestorHandle = {
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
}

type Props = {
  enabled: boolean
  id: string
  schema: Schema
  input: string
  cursorPos: number
  maxMatches?: number
  onSelect: (candidate: MentionItem, byKeyboard?: boolean) => void
  onClose?: () => void
  ref?: Ref<MentionSuggestorHandle>
}

export const MentionSuggestor = ({
  enabled,
  id,
  schema,
  input,
  cursorPos,
  maxMatches,
  onSelect,
  onClose,
  ref,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const query = extractActiveMention(input, cursorPos)
  const matches = matchSchemaCandidates({
    schema,
    query,
    options: { limit: maxMatches },
  })

  const handleItemMouseDown = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      const idx = Number(e.currentTarget.dataset.index)
      onSelect(matches[idx], false)
    },
    [matches, onSelect],
  )

  const handleItemMouseEnter = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const idx = Number(e.currentTarget.dataset.index)
      setHighlightedIndex(idx)
    },
    [],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!enabled) return

      // Always allow normal character input (don't interfere with typing after @)
      if (/^[a-zA-Z0-9-_]$/.test(e.key)) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => Math.min(prev + 1, matches.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          // Only process if there are items to select
          if (matches.length > 0) {
            e.preventDefault()
            onSelect(matches[highlightedIndex], true)
          }
          break
        case 'Escape':
          onClose?.()
          break
        default:
          break
      }
    },
    [matches, highlightedIndex, onClose, onSelect, enabled],
  )

  useImperativeHandle(ref, () => ({
    handleKeyDown(e) {
      handleKeyDown(e as unknown as KeyboardEvent<HTMLInputElement>)
    },
  }))

  // Reset the highlighted index when the query changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [])

  // Scroll to make the highlighted item enabled when it changes
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    // Use a small timeout to wait for DOM updates
    const timeoutId = setTimeout(() => {
      const active = containerRef.current?.querySelector(
        '[aria-selected="true"]',
      )
      if (active) (active as HTMLElement).scrollIntoView({ block: 'nearest' })
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [enabled])

  if (!enabled) return null

  return (
    <div ref={containerRef} className={styles.wrapper} id={id}>
      {matches.length === 0 ? (
        <div className={styles.emptyMessage} aria-disabled="true">
          {DEFAULT_NO_ITEMS_MESSAGE}
        </div>
      ) : (
        matches.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={styles.suggestorItem}
            data-index={i}
            data-highlighted={highlightedIndex === i}
            onMouseDown={handleItemMouseDown}
            onMouseEnter={handleItemMouseEnter}
          >
            <span className={styles.icon}>
              <MentionIcon item={item} />
            </span>
            <span className={styles.label}>
              <HighlightedLabel label={item.label} query={query} />
            </span>
          </button>
        ))
      )}
    </div>
  )
}
MentionSuggestor.displayName = 'MentionSuggestor'
