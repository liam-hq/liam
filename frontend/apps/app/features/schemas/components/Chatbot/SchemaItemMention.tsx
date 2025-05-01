'use client'

import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SchemaData, TableGroupData } from '../../../../app/api/chat/route'
import styles from './SchemaItemMention.module.css'
import type { SchemaItem } from './utils/schemaItemsAdapter'
import { convertSchemaToMentionItems } from './utils/schemaItemsAdapter'

interface SchemaItemMentionProps {
  inputValue: string
  cursorPosition: number
  schemaData: SchemaData
  tableGroups?: Record<string, TableGroupData>
  onSelect: (itemId: string, startPos: number, endPos: number) => void
  onClose: () => void
  containerRef: React.RefObject<HTMLDivElement>
  prioritizeTableGroups?: boolean
}

export const SchemaItemMention: React.FC<SchemaItemMentionProps> = ({
  inputValue,
  cursorPosition,
  schemaData,
  tableGroups,
  onSelect,
  onClose,
  containerRef,
  prioritizeTableGroups = false,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [allItems, setAllItems] = useState<SchemaItem[]>([])
  const [filteredItems, setFilteredItems] = useState<SchemaItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Initialize all items from schema data
  useEffect(() => {
    if (schemaData) {
      const items = convertSchemaToMentionItems(schemaData, tableGroups)
      setAllItems(items)
    }
  }, [schemaData, tableGroups])

  // Function to detect if we're in a mention context and extract the query
  const detectMention = useCallback(() => {
    if (cursorPosition <= 0 || inputValue.length === 0) {
      setIsVisible(false)
      return
    }

    // Look backwards from cursor position to find the last '@' character
    let startIndex = -1
    for (let i = cursorPosition - 1; i >= 0; i--) {
      // If we find a space or beginning of input before finding '@', then we're not in a mention
      if (inputValue[i] === ' ' || inputValue[i] === '\n') {
        break
      }
      if (inputValue[i] === '@') {
        startIndex = i
        break
      }
    }

    if (startIndex === -1) {
      setIsVisible(false)
      return
    }

    // Extract the query (text after '@')
    const query = inputValue.substring(startIndex + 1, cursorPosition)
    setMentionQuery(query)
    setMentionStartIndex(startIndex)
    setIsVisible(true)
  }, [inputValue, cursorPosition])

  // Filter items based on the query
  useEffect(() => {
    if (!isVisible) return

    // First filter items by query
    let filtered = allItems.filter((item) =>
      item.label.toLowerCase().includes(mentionQuery.toLowerCase()),
    )

    // If prioritizeTableGroups is true, sort to put table groups first
    if (prioritizeTableGroups) {
      filtered = [...filtered].sort((a, b) => {
        if (a.type === 'tableGroup' && b.type !== 'tableGroup') return -1
        if (a.type !== 'tableGroup' && b.type === 'tableGroup') return 1
        return 0
      })
    }

    setFilteredItems(filtered)
    setSelectedIndex(0) // Reset selection when filter changes
  }, [mentionQuery, isVisible, allItems, prioritizeTableGroups])

  // Detect mention when input or cursor changes
  useEffect(() => {
    detectMention()
  }, [detectMention])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev,
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredItems.length > 0) {
            const selectedItem = filteredItems[selectedIndex]
            onSelect(
              selectedItem.id,
              mentionStartIndex,
              mentionStartIndex + mentionQuery.length + 1,
            )
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [
      isVisible,
      filteredItems,
      selectedIndex,
      mentionStartIndex,
      mentionQuery,
      onSelect,
      onClose,
    ],
  )

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose, containerRef])

  // If not visible or no filtered items, don't render
  if (!isVisible || filteredItems.length === 0) {
    return null
  }

  // Highlight matching text in item label
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) return text

    return (
      <>
        {text.substring(0, index)}
        <span className={styles.highlight}>
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    )
  }

  return (
    <div className={styles.mentionDropdown} ref={dropdownRef}>
      {filteredItems.length > 0 ? (
        filteredItems.map((item, index) => (
          <div
            key={item.id}
            className={`${styles.mentionItem} ${
              index === selectedIndex ? styles.selected : ''
            }`}
            onClick={() =>
              onSelect(
                item.id,
                mentionStartIndex,
                mentionStartIndex + mentionQuery.length + 1,
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(
                  item.id,
                  mentionStartIndex,
                  mentionStartIndex + mentionQuery.length + 1,
                )
              }
            }}
            tabIndex={0}
            role="menuitem"
            aria-selected={index === selectedIndex}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className={styles.mentionName}>
              <span className={styles[item.type]}>{item.icon}</span>{' '}
              {highlightMatch(item.label, mentionQuery)}
            </div>
            <div className={styles.mentionDescription}>{item.description}</div>
          </div>
        ))
      ) : (
        <div className={styles.noResults}>No matching items found</div>
      )}
    </div>
  )
}
