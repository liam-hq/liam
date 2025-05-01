'use client'

import { usePathname } from 'next/navigation'
import type { FC } from 'react'
import { CommitDropdownMenu } from './CommitDropdownMenu'

type Props = {
  currentProjectId: string
  currentBranchOrCommit: string
  currentBranch?: string
  currentCommit?: string
}

export const CommitDropdownMenuWrapper: FC<Props> = ({
  currentProjectId,
  currentBranchOrCommit,
  currentBranch,
  currentCommit,
}) => {
  const pathname = usePathname()

  return (
    <CommitDropdownMenu
      currentProjectId={currentProjectId}
      currentBranchOrCommit={currentBranchOrCommit}
      currentBranch={currentBranch}
      currentCommit={currentCommit}
      pathname={pathname}
    />
  )
}
