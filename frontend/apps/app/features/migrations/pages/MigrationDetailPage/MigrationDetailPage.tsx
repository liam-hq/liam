import { prisma } from '@liam-hq/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import styles from './MigrationDetailPage.module.css'

type Params = {
  projectId: string
  migrationId: string
}
async function getMigration({ projectId, migrationId }: Params) {
  const migration = await prisma.migration.findUnique({
    where: {
      id: Number(migrationId),
      projectId: Number(projectId),
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      pullRequest: {
        select: {
          pullNumber: true,
        },
      },
    },
  })

  if (!migration) {
    return notFound()
  }

  return migration
}

type Props = {
  projectId: string
  migrationId: string
}

export const MigrationDetailPage: FC<Props> = async ({
  projectId,
  migrationId,
}) => {
  const migration = await getMigration({ projectId, migrationId })
  return (
    <div className={styles.wrapper}>
      <Link
        href={`/app/projects/${projectId}`}
        className={styles.backLink}
        aria-label="Back to project detail"
      >
        ← Back to Project Detail
      </Link>
      <div className={styles.heading}>
        <h1 className={styles.title}>{migration.title}</h1>
        <p className={styles.subTitle}>#{migration.pullRequest.pullNumber}</p>
      </div>
      <div className={styles.twoColumns}>
        <div className={styles.box}>
          <h2 className={styles.h2}>Migration Health</h2>
        </div>
        <div className={styles.box}>
          <h2 className={styles.h2}>Summary</h2>
        </div>
      </div>
    </div>
  )
}
