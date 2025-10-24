'use client'

import type { GitHubBranch } from '@liam-hq/github'
import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { urlgen } from '../../../../libs/routes'
import { BranchCombobox } from '../../../shared/BranchCombobox'
import styles from './BranchDropdownMenu.module.css'

type Props = {
  branches: GitHubBranch[]
  currentBranchName: string
  currentProjectId: string
}

export const Content: FC<Props> = ({
  branches,
  currentBranchName,
  currentProjectId,
}) => {
  const router = useRouter()
  const currentBranch = branches.find(
    (branch) => branch.name === currentBranchName,
  )

  const handleBranchChange = (branchSha: string) => {
    const nextBranch = branches.find((branch) => branch.sha === branchSha)
    if (!nextBranch) {
      return
    }

    router.push(
      urlgen('projects/[projectId]/ref/[branchOrCommit]', {
        projectId: currentProjectId,
        branchOrCommit: nextBranch.name,
      }),
    )
  }

  return (
    <BranchCombobox
      branches={branches}
      selectedBranchSha={currentBranch?.sha}
      onBranchChange={handleBranchChange}
      className={styles.trigger}
    />
  )
}
