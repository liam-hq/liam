import type { Installation } from '@liam-hq/github'
import type { FC } from 'react'
import { InstallationSelector } from './InstallationSelector/InstallationSelector'
import styles from './ProjectNewPage.module.css'

type Props = {
  installations: Installation[]
  organizationId: string
}

export const ProjectNewPage: FC<Props> = ({
  installations,
  organizationId,
}) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add a Project</h1>
      <InstallationSelector
        installations={installations}
        organizationId={organizationId}
      />
    </div>
  )
}
