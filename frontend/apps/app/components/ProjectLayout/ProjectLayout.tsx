import type { FC, PropsWithChildren } from 'react'
import { ProjectHeader } from './ProjectHeader'
import styles from './ProjectLayout.module.css'

type Props = PropsWithChildren & {
  projectId: string
  branchOrCommit?: string
}

export const ProjectLayout: FC<Props> = async ({
  children,
  projectId,
  branchOrCommit,
}) => {
  return (
    <div className={styles.container}>
      <ProjectHeader projectId={projectId} branchOrCommit={branchOrCommit} />
      <div className={styles.tabContent}>{children}</div>
    </div>
  )
}
