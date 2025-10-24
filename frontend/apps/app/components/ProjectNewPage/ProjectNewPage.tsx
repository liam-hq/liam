import type { Installation } from '@liam-hq/github'
import type { FC } from 'react'
import { TokenRefreshKick } from '../TokenRefreshKick'
import { InstallationEmpty } from './components/InstallationEmpty'
import { InstallationSelector } from './components/InstallationSelector'
import styles from './ProjectNewPage.module.css'

type Props = {
  installations: Installation[]
  organizationId: string
  needsRefresh?: boolean
}

export const ProjectNewPage: FC<Props> = ({
  installations,
  organizationId,
  needsRefresh,
}) => {
  const githubAppUrl = process.env.NEXT_PUBLIC_GITHUB_APP_URL

  return (
    <div className={styles.container}>
      <TokenRefreshKick trigger={needsRefresh} />
      <h1 className={styles.title}>Add a Project</h1>

      {installations.length === 0 ? (
        <InstallationEmpty githubAppUrl={githubAppUrl} />
      ) : (
        <InstallationSelector
          installations={installations}
          organizationId={organizationId}
          disabled={Boolean(needsRefresh)}
        />
      )}
    </div>
  )
}
