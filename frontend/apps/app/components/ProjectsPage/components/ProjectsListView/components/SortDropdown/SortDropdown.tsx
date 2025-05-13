'use client'

import { ChevronDown } from '@liam-hq/ui'
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@liam-hq/ui/src/components/DropdownMenu/DropdownMenu'
import type { FC } from 'react'
import { useState } from 'react'
import styles from './SortDropdown.module.css'

export type SortOption = 'activity' | 'name'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'activity', label: 'Sort by activity' },
  { value: 'name', label: 'Sort by project name' },
]

interface SortDropdownProps {
  initialSortOption?: SortOption
  onSortChange?: (option: SortOption) => void
}

export const SortDropdown: FC<SortDropdownProps> = ({
  initialSortOption = 'activity',
  onSortChange,
}) => {
  const [sortOption, setSortOption] = useState<SortOption>(initialSortOption)

  // Type guard to check if a string is a valid SortOption
  const isSortOption = (value: string): value is SortOption => {
    return SORT_OPTIONS.some((option) => option.value === value)
  }

  const handleSortChange = (value: string) => {
    if (isSortOption(value)) {
      setSortOption(value)
      if (onSortChange) {
        onSortChange(value)
      }
    }
  }

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <div className={styles.sortSelect}>
          <span>
            Sort by {sortOption === 'activity' ? 'activity' : 'project name'}
          </span>
          <ChevronDown className={styles.sortSelectIcon} aria-hidden="true" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" style={{ width: '282px' }}>
          <DropdownMenuRadioGroup
            value={sortOption}
            onValueChange={handleSortChange}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <DropdownMenuRadioItem key={value} value={value} label={label} />
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
