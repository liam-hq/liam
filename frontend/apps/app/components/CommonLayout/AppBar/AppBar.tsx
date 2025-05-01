import { AvatarWithImage } from '@/components'
import { ChevronRight } from '@/icons'
import type { FC } from 'react'
import styles from './AppBar.module.css'
import { BranchDropdownMenu } from './BranchDropdownMenu'
import { CommitDropdownMenu } from './CommitDropdownMenu'
import { ProjectsDropdownMenu } from './ProjectsDropdownMenu'
import { getAuthUser } from './services/getAuthUser'

type Props = {
  currentProjectId?: string
  currentBranchOrCommit?: string
  currentBranch?: string // 特定のブランチを表示する場合（ルーティングbの場合）
  currentCommit?: string // 特定のコミットを表示する場合（ルーティングbの場合）
}

export const AppBar: FC<Props> = async ({
  currentProjectId,
  currentBranchOrCommit,
  currentBranch,
  currentCommit,
}) => {
  const { data: authUser } = await getAuthUser()

  const avatarUrl = authUser.user?.user_metadata?.avatar_url

  return (
    <div className={styles.wrapper}>
      <div className={styles.leftSection}>
        {currentProjectId && (
          <div className={styles.breadcrumbs}>
            <ProjectsDropdownMenu currentProjectId={currentProjectId} />
            {currentBranchOrCommit && (
              <>
                <ChevronRight className={styles.chevronRight} />
                <BranchDropdownMenu
                  currentProjectId={currentProjectId}
                  currentBranchOrCommit={currentBranch || currentBranchOrCommit}
                />
                
                {/* 新しいコミットドロップダウンメニュー */}
                <ChevronRight className={styles.chevronRight} />
                <CommitDropdownMenu
                  currentProjectId={currentProjectId}
                  currentBranchOrCommit={currentCommit || currentBranchOrCommit}
                  currentBranch={currentBranch}
                />
              </>
            )}
          </div>
        )}
      </div>
      <div className={styles.rightSection}>
        {avatarUrl && (
          <AvatarWithImage src={avatarUrl} alt="User profile" size="sm" />
        )}
      </div>
    </div>
  )
}
