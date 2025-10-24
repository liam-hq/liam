'use client'

import { ChevronDown, Code, GitBranch, Search, Spinner } from '@liam-hq/ui'
import clsx from 'clsx'
import { Command } from 'cmdk'
import { type FC, useCallback, useEffect, useRef, useState } from 'react'
import styles from './BranchCombobox.module.css'

export type Branch = {
  name: string
  sha: string
  isProduction: boolean
}

type Props = {
  branches: Branch[]
  selectedBranchSha?: string
  onBranchChange: (sha: string) => void
  disabled?: boolean
  isLoading?: boolean
  isError?: boolean
  className?: string
}

export const BranchCombobox: FC<Props> = ({
  branches,
  selectedBranchSha,
  onBranchChange,
  disabled = false,
  isLoading = false,
  isError = false,
  className,
}) => {
  const [open, setOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const branch = branches.find((b) => b.sha === selectedBranchSha) || null
    setSelectedBranch(branch)
  }, [branches, selectedBranchSha])

  const handleSelect = useCallback(
    (branchSha: string) => {
      onBranchChange(branchSha)
      setOpen(false)
    },
    [onBranchChange],
  )

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }, [])

  const handleInputChange = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0 })
    }
  }, [])

  const handleTriggerClick = useCallback(() => {
    if (!disabled) {
      if (!open && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        })
      }
      setOpen(!open)
    }
  }, [disabled, open])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && !target.closest('[data-combobox]')) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [open])

  return (
    <div className={clsx(styles.container, className)} data-combobox>
      <Command onKeyDown={handleKeyDown}>
        <button
          ref={triggerRef}
          type="button"
          className={clsx(
            styles.trigger,
            disabled && styles.disabled,
            isError && styles.error,
          )}
          onClick={handleTriggerClick}
          disabled={disabled}
        >
          <div className={styles.content}>
            {selectedBranch && <GitBranch className={styles.branchIcon} />}
            <span className={styles.branchName}>
              {selectedBranch?.name || 'Select a branch...'}
            </span>
            {selectedBranch?.isProduction && (
              <Code size="sm" style="fill">
                default
              </Code>
            )}
          </div>
          <ChevronDown
            className={clsx(styles.chevronIcon, open && styles.open)}
          />
        </button>

        {open && (
          <div
            className={clsx(styles.dropdown, isError && styles.error)}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} />
              <Command.Input
                placeholder="Search branches..."
                className={styles.searchInput}
                autoFocus
                onValueChange={handleInputChange}
              />
            </div>
            {isError ? (
              <p className={styles.errorMessage}>Failed to load branches.</p>
            ) : isLoading ? (
              <div className={styles.loading}>
                <Spinner />
              </div>
            ) : (
              <Command.List ref={listRef} className={styles.list}>
                <Command.Empty className={styles.empty}>
                  No branches found.
                </Command.Empty>
                <Command.Group>
                  {branches.map((branch) => (
                    <Command.Item
                      key={`${branch.sha}-${branch.name}`}
                      value={`${branch.name} ${branch.sha}`}
                      onSelect={() => handleSelect(branch.sha)}
                      className={clsx(
                        styles.item,
                        selectedBranchSha === branch.sha && styles.selected,
                      )}
                    >
                      <GitBranch className={styles.itemIcon} />
                      <span className={styles.itemLabel}>{branch.name}</span>
                      {branch.isProduction && (
                        <Code size="sm" style="fill">
                          default
                        </Code>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            )}
          </div>
        )}
      </Command>
    </div>
  )
}
