import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
} from '@liam-hq/ui'
import { Check, GitBranch } from '@liam-hq/ui/src/icons'
import type { ComponentProps } from 'react'
import styles from './BranchDropdown.module.css'

interface BranchItem {
  id: string
  name: string
  tag?: string
}

interface BranchDropdownProps extends ComponentProps<'div'> {
  branches: BranchItem[]
  selectedBranchId?: string | undefined
  onBranchSelect: (branch: BranchItem) => void
}

export const BranchDropdown = ({
  branches,
  selectedBranchId,
  onBranchSelect,
  ...props
}: BranchDropdownProps) => {
  return (
    <DropdownMenuPortal>
      <DropdownMenuContent
        className={styles.dropdownContainer}
        sideOffset={5}
        align="start"
        {...props}
      >
        <div className={styles.branchesList}>
          {/* Sort branches to put the selected branch at the top */}
          {branches
            .slice()
            .sort((a, b) => {
              // If a is selected, it comes first
              if (a.id === selectedBranchId) return -1
              // If b is selected, it comes first
              if (b.id === selectedBranchId) return 1
              // Otherwise, maintain original order
              return 0
            })
            .map((branch) => (
              <DropdownMenuItem
                key={branch.id}
                className={`${styles.branchItem} ${
                  branch.id === selectedBranchId ? styles.selected : ''
                }`}
                onClick={() => onBranchSelect(branch)}
                leftIcon={
                  <GitBranch
                    width={16}
                    height={16}
                    color="rgba(255, 255, 255, 0.2)"
                  />
                }
              >
                <div className={styles.branchContent}>
                  <span
                    className={
                      branch.tag === 'production'
                        ? styles.branchNameWithBadge
                        : styles.branchName
                    }
                  >
                    {branch.name}
                  </span>
                  {branch.tag === 'production' && (
                    <span className={styles.branchTag}>{branch.tag}</span>
                  )}
                </div>
                {branch.id === selectedBranchId && (
                  <span className={styles.chevronContainer}>
                    <Check width={10} height={10} color="#1DED83" />
                  </span>
                )}
              </DropdownMenuItem>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  )
}
