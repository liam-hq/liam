import type { FC } from 'react'
import { InstallationLoader } from './components/InstallationLoader/InstallationLoader'
import styles from './ProjectNewPage.module.css'

type Props = {
  organizationId: string
}

export const ProjectNewPage: FC<Props> = ({ organizationId }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add a Project</h1>
      <InstallationLoader organizationId={organizationId} />
    </div>
  )
}
