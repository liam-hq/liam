import { prisma } from '@liam-hq/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import styles from './ProjectDetailPage.module.css'

type Props = {
  projectId: string
}

async function getProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: Number(projectId),
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      migrations: {
        select: {
          id: true,
          title: true,
          pullRequest: {
            select: {
              pullNumber: true,
            },
          },
        },
      },
    },
  })

  if (!project) {
    notFound()
  }

  return project
}

export const ProjectDetailPage: FC<Props> = async ({ projectId }) => {
  const project = await getProject(projectId)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link
            href="/app/projects"
            className={styles.backLink}
            aria-label="Back to projects list"
          >
            ← Back to Projects
          </Link>
          <h1 className={styles.title}>{project.name || 'Untitled Project'}</h1>
        </div>
        <Link
          href={`/app/projects/${project.id}/migrations`}
          className={styles.reviewButton}
        >
          View Migrations
        </Link>
      </div>

      <div className={styles.content}>
        <p className={styles.createdAt}>
          Created: {project.createdAt.toLocaleDateString('en-US')}
        </p>
      </div>
      <section style={{ margin: '24px 0' }}>
        <h2 style={{ fontSize: '24px' }}>Migrations</h2>
        <ul style={{ display: 'grid', gap: '12px', margin: '16px 0' }}>
          {project.migrations.map((migration) => (
            <li key={migration.id}>
              <Link
                href={`/app/projects/${project.id}/migrations/${migration.id}`}
                style={{
                  textDecoration: 'underline',
                }}
              >{`${migration.title} #${migration.pullRequest.pullNumber}`}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
