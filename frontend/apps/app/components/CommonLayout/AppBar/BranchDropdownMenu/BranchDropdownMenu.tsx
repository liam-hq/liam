import type { FC } from 'react'
import { Content } from './Content'
import { getBranches } from './services/getBranches'

type Props = {
  currentProjectId: string
  currentBranchOrCommit: string
}

export const BranchDropdownMenu: FC<Props> = async ({
  currentProjectId,
  currentBranchOrCommit,
}) => {
  const branches = await getBranches(currentProjectId)
  const currentBranch = branches.find(
    (branch) => branch.name === currentBranchOrCommit,
  )

  if (currentBranch == null) {
    return null
  }

  return (
    <Content
      branches={branches}
      currentBranchName={currentBranch.name}
      currentProjectId={currentProjectId}
    />
  )
}
