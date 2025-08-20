'use client'

import type { FC } from 'react'
import { type Branch, BranchCombobox } from '@/components/shared/BranchCombobox'
import styles from './BranchesDropdown.module.css'

type Props = {
  branches: Branch[]
  // eslint-disable-next-line no-restricted-syntax
  selectedBranchSha?: string
  onBranchChange: (sha: string) => void
  disabled: boolean
  isLoading: boolean
}

export const BranchesDropdown: FC<Props> = ({
  branches,
  selectedBranchSha,
  onBranchChange,
  disabled,
  isLoading,
}) => {
  return (
    <BranchCombobox
      branches={branches}
      selectedBranchSha={selectedBranchSha}
      onBranchChange={onBranchChange}
      disabled={disabled || isLoading}
      isLoading={isLoading}
      placeholder="Search branches..."
      className={styles.container}
    />
  )
}

export type { Branch }
