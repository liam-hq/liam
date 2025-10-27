'use client'

import clsx from 'clsx'
import type { FC } from 'react'
import type { TocItem } from '../types'
import styles from './DesktopToC.module.css'

type Props = {
  items: TocItem[]
  activeId: string
}

export const DesktopToC: FC<Props> = ({ items, activeId }) => {
  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav className={styles.toc}>
      <h3 className={styles.title}>Table of Contents</h3>
      <ul className={styles.list}>
        {items.map((item) => (
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
  )
}
