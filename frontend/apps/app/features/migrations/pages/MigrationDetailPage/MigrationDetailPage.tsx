import {
  getPullRequestDetails,
  getPullRequestFiles,
} from '@/libs/github/api.server'
import { prisma } from '@liam-hq/db'
import { minimatch } from 'minimatch'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import styles from './MigrationDetailPage.module.css'

type Props = {
  migrationId: string
}

async function getMigrationContents(migrationId: string) {
  const migration = await prisma.migration.findUnique({
    where: {
      id: Number(migrationId),
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      pullRequest: {
        select: {
          id: true,
          pullNumber: true,
          repository: {
            select: {
              installationId: true,
              name: true,
              owner: true,
            },
          },
        },
      },
    },
  })

  if (!migration) {
    return notFound()
  }

  const pullRequest = migration.pullRequest
  const { repository } = pullRequest

  const overallReview = await prisma.overallReview.findFirst({
    where: {
      pullRequestId: pullRequest.id,
    },
  })

  if (!overallReview) {
    return notFound()
  }

  const prDetails = await getPullRequestDetails(
    Number(repository.installationId),
    repository.owner,
    repository.name,
    Number(pullRequest.pullNumber),
  )

  const files = await getPullRequestFiles(
    Number(repository.installationId),
    repository.owner,
    repository.name,
    Number(pullRequest.pullNumber),
  )

  const patterns = await prisma.watchSchemaFilePattern.findMany({
    where: { projectId: Number(overallReview.projectId) },
    select: { pattern: true },
  })

  const matchedFiles = files
    .map((file) => file.filename)
    .filter((filename) =>
      patterns.some((pattern) => minimatch(filename, pattern.pattern)),
    )

  const erdLinks = matchedFiles.map((filename) => ({
    path: `/app/projects/${overallReview.projectId}/erd/${prDetails.head.ref}/${filename}`,
    filename,
  }))

  return {
    migration,
    overallReview,
    erdLinks,
  }
}

export const MigrationDetailPage: FC<Props> = async ({ migrationId }) => {
  const { migration, overallReview, erdLinks } =
    await getMigrationContents(migrationId)

  const projectId = overallReview.projectId

  const formattedReviewDate = overallReview.reviewedAt
    ? overallReview.reviewedAt.toLocaleDateString('en-US')
    : 'Not available'

  return (
    <main className={styles.wrapper}>
      <Link href={`/app/projects/${projectId}`} className={styles.backLink}>
        ← Back to Project Detail
      </Link>

      <div className={styles.heading}>
        <h1 className={styles.title}>{migration.title}</h1>
        <p className={styles.subTitle}>#{migration.pullRequest.pullNumber}</p>
      </div>
      <div className={styles.twoColumns}>
        <div className={styles.box}>
          <h2 className={styles.h2}>Migration Health</h2>
          <div className={styles.erdLinks}>
            {erdLinks.map(({ path, filename }) => (
              <Link key={path} href={path} className={styles.erdLink}>
                View ERD Diagram: {filename} →
              </Link>
            ))}
          </div>
        </div>
        <div className={styles.box}>
          <h2 className={styles.h2}>Summary</h2>
        </div>
        <div className={styles.box}>
          <h2 className={styles.h2}>Review Content</h2>
          <pre className={styles.reviewContent}>
            {overallReview.reviewComment}
          </pre>
        </div>
      </div>

      <div className={styles.metadataSection}>
        <p className={styles.metadata}>Review Date: {formattedReviewDate}</p>
      </div>
    </main>
  )
}
