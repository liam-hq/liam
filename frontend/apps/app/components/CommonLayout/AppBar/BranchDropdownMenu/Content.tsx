'use client'

import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { urlgen } from '../../../../libs/routes'
import { BranchCombobox } from '../../../shared/BranchCombobox'
import styles from './BranchDropdownMenu.module.css'

type Props = {
  branches: Array<{ name: string; sha: string; protected: boolean }>
  currentBranchName: string
  currentProjectId: string
}

export const Content: FC<Props> = ({
  branches,
  currentBranchName,
  currentProjectId,
}) => {
  const router = useRouter()

  const handleBranchChange = (branchName: string) => {
    router.push(
      urlgen('projects/[projectId]/ref/[branchOrCommit]', {
        projectId: currentProjectId,
        branchOrCommit: branchName,
      }),
    )
  }

  return (
    <BranchCombobox
      branches={branches}
      selectedBranchSha={currentBranchName}
      onBranchChange={handleBranchChange}
      placeholder="Search branches..."
      className={styles.trigger}
    />
  )
}
