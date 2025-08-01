'use client'

import clsx from 'clsx'
import { type FC, useEffect, useState } from 'react'
import styles from './TableOfContents.module.css'

type TocItem = {
  id: string
  text: string
  level: number
  parentId?: string // For use cases to link to their parent requirement
}

type Props = {
  content: string
}

const createId = (text: string, prefix = '') => {
  const base = text
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return prefix ? `${prefix}${base.substring(0, 50)}` : base
}

const parseHeading = (line: string): TocItem | null => {
  const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
  if (!headingMatch) return null

  const levelMatch = headingMatch[1]
  const text = headingMatch[2]
  if (!levelMatch || !text) return null

  const level = levelMatch.length
  const id = createId(text)

  return { id, text, level }
}

const parseUseCase = (
  line: string,
  currentFunctionalReqId: string | undefined,
): TocItem | null => {
  if (!currentFunctionalReqId) return null

  const useCaseMatch = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*$/)
  if (!useCaseMatch) return null

  const number = useCaseMatch[1]
  const title = useCaseMatch[2]
  if (!number || !title) return null

  const id = createId(title, `use-case-${number}-`)

  return {
    id,
    text: `${number}. ${title}`,
    level: 5, // Treat use cases as level 5 for deeper nesting
    parentId: currentFunctionalReqId,
  }
}

const extractTocItems = (content: string): TocItem[] => {
  const items: TocItem[] = []
  let currentFunctionalReqId: string | undefined

  const lines = content.split('\n')
  for (const line of lines) {
    const heading = parseHeading(line)
    if (heading) {
      items.push(heading)
      // Track current functional requirement for use cases
      if (heading.level === 4 && heading.text.match(/^\d+\.\s+/)) {
        currentFunctionalReqId = heading.id
      }
      continue
    }

    const useCase = parseUseCase(line, currentFunctionalReqId)
    if (useCase) {
      items.push(useCase)
    }
  }

  return items
}

export const TableOfContents: FC<Props> = ({ content }) => {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const items = extractTocItems(content)
    setToc(items)
  }, [content])

  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll(
        'h1, h2, h3, h4, li[id^="use-case-"]',
      )
      const scrollPosition = window.scrollY + 100

      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i]
        if (
          element &&
          element.getBoundingClientRect().top + window.scrollY <= scrollPosition
        ) {
          setActiveId(element.id || '')
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (toc.length === 0) {
    return null
  }

  return (
    <nav className={styles.toc}>
      <h3 className={styles.title}>Table of Contents</h3>
      <ul className={styles.list}>
        {toc.map((item) => (
          <li
            key={item.id}
            className={clsx(
              styles.item,
              item.level === 1 && styles.level1,
              item.level === 2 && styles.level2,
              item.level === 3 && styles.level3,
              item.level === 4 && styles.level4,
              item.level === 5 && styles.level5,
              activeId === item.id && styles.active,
            )}
          >
            <button
              type="button"
              onClick={() => handleClick(item.id)}
              className={styles.link}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
