'use client'

import {
  ChevronDown,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useRef } from 'react'
import type { TocItem } from '../types'
import styles from './MobileToC.module.css'

type Props = {
  items: TocItem[]
  activeId: string
}

export const MobileToC: FC<Props> = ({ items, activeId }) => {
  const listRef = useRef<HTMLUListElement>(null)

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <DropdownMenuRoot modal={false}>
      <DropdownMenuTrigger className={styles.trigger}>
        <span className={styles.text}>Table of Contents</span>
        <ChevronDown className={styles.icon} />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={12}
          className={styles.content}
        >
          <ul ref={listRef} className={styles.list}>
            {items.map(({ id, level, text }) => (
              <li
                key={`mobile-toc-${id}`}
                className={clsx(
                  styles.item,
                  level === 2 && styles.level2,
                  level === 3 && styles.level3,
                  level === 4 && styles.level4,
                  level === 5 && styles.level5,
                )}
              >
                <button
                  type="button"
                  aria-current={activeId === id ? 'location' : undefined}
                  className={clsx(
                    styles.button,
                    activeId === id && styles.active,
                  )}
                  onClick={() => handleClick(id)}
                >
                  {text}
                </button>
              </li>
            ))}
          </ul>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
