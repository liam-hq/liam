'use client'

import clsx from 'clsx'
import { type FC, useEffect, useState } from 'react'
import styles from './TableOfContents.module.css'
import { extractTocItems, type TocItem } from './utils'

type Props = {
  content: string
}

export const TableOfContents: FC<Props> = ({ content }) => {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)

  useEffect(() => {
    const items = extractTocItems(content)
    setToc(items)
  }, [content])

  useEffect(() => {
    const handleScroll = () => {
      // Search for headings within Artifact content
      const contentWrapper = document.querySelector('[data-artifact-content]')
      if (!contentWrapper) {
        return
      }

      const elements = contentWrapper.querySelectorAll(
        'h1[id], h2[id], h3[id], h4[id], h5[id]',
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
    setActiveId(id) // Set activeId immediately on click
    setIsOpen(false) // Close the mobile menu after clicking
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleToc = () => {
    setIsOpen(!isOpen)
  }

  if (toc.length === 0) {
    return null
  }

  return (
    <>
      {/* Toggle button for mobile - only shows on small screens */}
      <button
        type="button"
        onClick={toggleToc}
        className={styles.toggleButton}
        aria-label="Toggle Table of Contents"
        aria-expanded={isOpen}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>Contents</span>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false)
            }
          }}
          tabIndex={-1}
          aria-label="Close Table of Contents"
        />
      )}

      {/* Table of Contents */}
      <nav className={clsx(styles.toc, isOpen && styles.tocOpen)}>
        <div className={styles.tocHeader}>
          <h3 className={styles.title}>Table of Contents</h3>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
            aria-label="Close Table of Contents"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <ul className={styles.list}>
          {toc.map((item) => (
            <li
              key={`toc-${item.id}`}
              className={clsx(
                styles.item,
                item.level === 1 && styles.level1,
                item.level === 2 && styles.level2,
                item.level === 3 && styles.level3,
                item.level === 4 && styles.level4,
                item.level === 5 && styles.level5,
              )}
            >
              <button
                type="button"
                onClick={() => handleClick(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClick(item.id)
                  }
                }}
                className={clsx(
                  styles.link,
                  activeId === item.id && styles.active,
                )}
                tabIndex={0}
                aria-label={`Navigate to ${item.text}`}
                aria-current={activeId === item.id ? 'location' : undefined}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
