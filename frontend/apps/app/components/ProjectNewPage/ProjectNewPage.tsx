import type { Installation } from '@liam-hq/github'
import type { FC } from 'react'
import { TokenRefreshKick } from '../TokenRefreshKick'
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
  return (
    <div className={styles.container}>
      <TokenRefreshKick trigger={needsRefresh} />
      <h1 className={styles.title}>Add a Project</h1>
      <InstallationSelector
        installations={installations}
        organizationId={organizationId}
        disabled={Boolean(needsRefresh)}
      />
    </div>
  )
}
