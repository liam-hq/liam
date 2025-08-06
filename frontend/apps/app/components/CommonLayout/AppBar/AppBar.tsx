import type { FC } from 'react'
import { ChevronRight } from '@/icons'
import styles from './AppBar.module.css'
import { BranchDropdownMenu } from './BranchDropdownMenu'
import { ConnectProjectButton } from './ConnectProjectButton'
import { ProjectsDropdownMenu } from './ProjectsDropdownMenu'
import { getAuthUser } from './services/getAuthUser'
import { UserDropdown } from './UserDropdown'

type Props = {
  currentProjectId?: string
  currentBranchOrCommit?: string
  designSessionId?: string
}

export const AppBar: FC<Props> = async ({
  currentProjectId,
  currentBranchOrCommit,
  designSessionId,
}) => {
  const { data: authUser } = await getAuthUser()

  let sessionData = null
  if (designSessionId && !currentProjectId) {
    const { getDesignSessionWithTimelineItems } = await import(
      '@/components/SessionDetailPage/services/designSessionWithTimelineItems/server/getDesignSessionWithTimelineItems'
    )
    sessionData = await getDesignSessionWithTimelineItems(designSessionId)
  }

  const avatarUrl = authUser.user?.user_metadata?.avatar_url
  return (
    <div className={styles.wrapper}>
      <div className={styles.leftSection}>
        {currentProjectId ? (
          <div className={styles.breadcrumbs}>
            <ProjectsDropdownMenu currentProjectId={currentProjectId} />
            {currentBranchOrCommit && (
              <>
                <ChevronRight className={styles.chevronRight} />
                <BranchDropdownMenu
                  currentProjectId={currentProjectId}
                  currentBranchOrCommit={currentBranchOrCommit}
                />
              </>
            )}
          </div>
        ) : sessionData ? (
          <div className={styles.sessionInfo}>
            <span className={styles.sessionName}>
              {sessionData.name || 'Untitled Session'}
            </span>
            <ConnectProjectButton sessionId={designSessionId!} />
          </div>
        ) : null}
      </div>
      <div className={styles.rightSection}>
        {avatarUrl && <UserDropdown avatarUrl={avatarUrl} />}
      </div>
    </div>
  )
}
