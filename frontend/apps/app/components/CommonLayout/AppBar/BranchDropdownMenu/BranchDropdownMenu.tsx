import type { FC } from 'react'
import { DropdownMenuRoot, DropdownMenuTrigger } from '@/components'
import { ChevronsUpDown } from '@/icons'
import styles from './BranchDropdownMenu.module.css'
import { Content } from './Content'
import { type Branch, getBranches } from './services/getBranches'

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
    <DropdownMenuRoot>
      <Trigger currentBranch={currentBranch} />
      <Content
        currentBranch={currentBranch}
        branches={branches}
        currentProjectId={currentProjectId}
      />
    </DropdownMenuRoot>
  )
}

type TriggerProps = {
  currentBranch: Branch
}

const Trigger: FC<TriggerProps> = ({ currentBranch }) => {
  return (
    <DropdownMenuTrigger className={styles.trigger}>
      <div className={styles.nameAndTag}>
        <span className={styles.name}>{currentBranch.name}</span>
        {currentBranch.protected && (
          <span className={styles.tag}>production</span>
        )}
      </div>
      <ChevronsUpDown className={styles.chevronIcon} />
    </DropdownMenuTrigger>
  )
}
