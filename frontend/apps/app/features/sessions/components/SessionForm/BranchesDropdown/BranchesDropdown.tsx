'use client'

import {
  ChevronDown,
  Code,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  GitBranch,
} from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './BranchesDropdown.module.css'
import { Content } from './Content'

export type Branch = {
  name: string
  sha: string
  protected: boolean
}

type Props = {
  branches: Branch[]
  selectedBranchSha?: string
  onBranchChange: (sha: string) => void
  disabled?: boolean
  isLoading?: boolean
}

export const BranchesDropdown: FC<Props> = ({
  branches,
  selectedBranchSha,
  onBranchChange,
  disabled = false,
  isLoading = false,
}) => {
  const selectedBranch = branches.find((b) => b.sha === selectedBranchSha)
  const label = selectedBranch?.name || 'Select a branch...'

  return (
    <DropdownMenuRoot>
      <Trigger
        label={label}
        disabled={disabled || isLoading}
        hasSelection={!!selectedBranch}
        isProtected={selectedBranch?.protected || false}
      />
      <Content
        branches={branches}
        selectedBranchSha={selectedBranchSha}
        onBranchChange={onBranchChange}
      />
    </DropdownMenuRoot>
  )
}

type TriggerProps = {
  label: string
  disabled?: boolean
  hasSelection: boolean
  isProtected: boolean
}

const Trigger: FC<TriggerProps> = ({
  label,
  disabled,
  hasSelection,
  isProtected,
}) => {
  return (
    <DropdownMenuTrigger className={styles.trigger} disabled={disabled}>
      <div className={styles.iconAndName}>
        {hasSelection && <GitBranch className={styles.branchIcon} />}
        <span className={styles.branchName}>{label}</span>
        {hasSelection && isProtected && (
          <Code size="sm" style="fill">
            production
          </Code>
        )}
      </div>
      <ChevronDown className={styles.chevronIcon} />
    </DropdownMenuTrigger>
  )
}
