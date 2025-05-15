import Link from 'next/link'
import type { FC } from 'react'
import styles from './EmptyProjectsState.module.css'
import { JackInBox } from './JackInBox'
import { JackNoResult } from './JackNoResult'

interface EmptyProjectsStateProps {
  createProjectHref?: string
  projects?: unknown[] | null
}

export const EmptyProjectsState: FC<EmptyProjectsStateProps> = ({
  createProjectHref = '/organizations/new',
  projects = null,
}) => {
  return (
    <div className={styles.container}>
      {projects === null ? (
        <div className={styles.content}>
          <JackInBox className={styles.illustration} />
          <h2 className={styles.title}>No projects have been created yet</h2>
          <p className={styles.description}>
            <span>There are no projects exist.</span>
            <br />
            <span>
              Start creating a new project to begin managing your schema!
            </span>
          </p>

          <Link href={createProjectHref} className={styles.createButton}>
            Add New Project
          </Link>
        </div>
      ) : (
        <div className={styles.content}>
          <JackNoResult />
          <h3 className={styles.title}>Oops! No results found</h3>
          <p className={styles.description}>
            Looks like there are no projects matching your search.
            <br />
            Try using different keywords.
          </p>
        </div>
      )}
    </div>
  )
}
