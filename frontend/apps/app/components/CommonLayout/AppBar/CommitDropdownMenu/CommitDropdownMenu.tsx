import { DropdownMenuRoot, DropdownMenuTrigger } from '@/components'
import { ChevronsUpDown } from '@/icons'
import type { FC } from 'react'
import styles from './CommitDropdownMenu.module.css'
import { Content } from './Content'
import { type Commit, getCommits } from './services/getCommits'

type Props = {
  currentProjectId: string
  currentBranchOrCommit: string
  currentBranch?: string // 特定のブランチを表示する場合（ルーティングbの場合）
}

export const CommitDropdownMenu: FC<Props> = async ({
  currentProjectId,
  currentBranchOrCommit,
  currentBranch,
}) => {
  // ルーティングaの場合はcurrentBranchOrCommitがブランチ名
  // ルーティングbの場合はcurrentBranchが指定されている
  const branch = currentBranch || currentBranchOrCommit
  
  // コミット一覧の取得
  const commits = await getCommits(currentProjectId, branch, currentBranchOrCommit)
  
  // コミットが取得できない場合は表示しない
  if (commits.length === 0) {
    return null
  }
  
  // 現在のコミットを特定
  // ルーティングaの場合は最新コミット
  // ルーティングbの場合は指定されたコミット
  const isLatest = !currentBranch
  const currentCommit = isLatest 
    ? commits[0] 
    : commits.find(commit => commit.sha.startsWith(currentBranchOrCommit)) || commits[0]

  return (
    <DropdownMenuRoot>
      <Trigger currentCommit={currentCommit} isLatest={isLatest} />
      <Content
        currentCommit={currentCommit}
        commits={commits}
        currentProjectId={currentProjectId}
        currentBranch={branch}
        isLatest={isLatest}
      />
    </DropdownMenuRoot>
  )
}

type TriggerProps = {
  currentCommit: Commit
  isLatest: boolean
}

const Trigger: FC<TriggerProps> = ({ currentCommit, isLatest }) => {
  return (
    <DropdownMenuTrigger className={styles.trigger}>
      <div className={styles.nameAndTag}>
        <span className={styles.name}>
          {isLatest ? `latest (${currentCommit.shortSha})` : currentCommit.shortSha}
        </span>
      </div>
      <ChevronsUpDown className={styles.chevronIcon} />
    </DropdownMenuTrigger>
  )
}
