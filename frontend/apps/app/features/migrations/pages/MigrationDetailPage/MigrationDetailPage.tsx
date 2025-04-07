import { createClient } from '@/libs/db/server'
import { urlgen } from '@/utils/routes'
import { getPullRequestDetails, getPullRequestFiles } from '@liam-hq/github'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import styles from './MigrationDetailPage.module.css'

type Props = {
  migrationId: string
}

async function getMigrationContents(migrationId: string) {
  const supabase = await createClient()

  // Get migration with pull request and repository details
  const { data: migration, error: migrationError } = await supabase
    .from('Migration')
    .select(`
      id,
      title,
      createdAt,
      pullRequestId,
      PullRequest:pullRequestId (
        id,
        pullNumber,
        repositoryId,
        Repository:repositoryId (
          id,
          installationId,
          name,
          owner
        )
      )
    `)
    .eq('id', Number(migrationId))
    .single()

  if (migrationError || !migration) {
    console.error('Error fetching migration:', migrationError)
    return notFound()
  }

  const pullRequest = migration.PullRequest
  const repository = pullRequest.Repository

  // Get overall review
  const { data: overallReview, error: reviewError } = await supabase
    .from('OverallReview')
    .select('*')
    .eq('pullRequestId', pullRequest.id)
    .single()

  if (reviewError || !overallReview) {
    console.error('Error fetching overall review:', reviewError)
    return notFound()
  }

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

  const { data: schemaPaths, error: pathsError } = await supabase
    .from('GitHubSchemaFilePath')
    .select('path')
    .eq('projectId', overallReview.projectId || 0)

  if (pathsError) {
    console.error('Error fetching schema paths:', pathsError)
    return notFound()
  }

  const matchedFiles = files
    .map((file) => file.filename)
    .filter((filename) =>
      schemaPaths.some((schemaPath) => filename === schemaPath.path),
    )

  const erdLinks = matchedFiles.map((filename) => ({
    path: urlgen(
      'projects/[projectId]/ref/[branchOrCommit]/schema/[...schemaFilePath]',
      {
        projectId: `${overallReview.projectId}`,
        branchOrCommit: prDetails.head.ref,
        schemaFilePath: filename,
      },
    ),
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

  const formattedReviewDate = new Date(
    overallReview.reviewedAt,
  ).toLocaleDateString('en-US')

  return (
    <main className={styles.wrapper}>
      <Link
        href={urlgen('projects/[projectId]', { projectId: `${projectId}` })}
        className={styles.backLink}
      >
        ← Back to Project Detail
      </Link>

      <div className={styles.heading}>
        <h1 className={styles.title}>{migration.title}</h1>
        <p className={styles.subTitle}>#{migration.PullRequest.pullNumber}</p>
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
