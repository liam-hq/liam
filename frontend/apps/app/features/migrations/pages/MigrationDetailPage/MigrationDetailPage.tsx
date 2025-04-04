import { createClient } from '@/libs/db/server'
import { urlgen } from '@/utils/routes'
import { getPullRequestDetails, getPullRequestFiles } from '@liam-hq/github'
import { clsx } from 'clsx'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import { UserFeedbackClient } from '../../../../components/UserFeedbackClient'
import { RadarChart } from '../../components/RadarChart/RadarChart'
import type { CategoryEnum } from '../../components/RadarChart/RadarChart'
import styles from './MigrationDetailPage.module.css'

type Props = {
  migrationId: string
}

async function getMigrationContents(migrationId: string) {
  const supabase = await createClient()

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

  const { data: overallReview, error: reviewError } = await supabase
    .from('OverallReview')
    .select(`
      *,
      reviewIssues:ReviewIssue (
        id,
        category,
        severity,
        description,
        suggestion
      ),
      reviewScores:ReviewScore (
        id,
        overallReviewId,
        overallScore,
        category,
        reason
      )
    `)
    .eq('pullRequestId', pullRequest.id)
    .order('createdAt', { ascending: false })
    .limit(1)
    .single()

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

  // If there's no overallReview, return with empty review data
  if (reviewError || !overallReview) {
    console.info('No OverallReview found for migration:', migrationId)
    return {
      migration,
      overallReview: {
        id: null,
        projectId: null,
        reviewComment: null,
        reviewedAt: null,
        reviewIssues: [],
        reviewScores: [],
      },
      erdLinks: [],
    }
  }

  const { data: schemaPaths, error: pathsError } = await supabase
    .from('GitHubSchemaFilePath')
    .select('path')
    .eq('projectId', overallReview.projectId || 0)

  if (pathsError) {
    console.error('Error fetching schema paths:', pathsError)
    return {
      migration,
      overallReview,
      erdLinks: [],
    }
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

  const formattedReviewDate = overallReview.reviewedAt
    ? new Date(overallReview.reviewedAt).toLocaleDateString('en-US')
    : 'Not reviewed yet'

  return (
    <main className={styles.wrapper}>
      {projectId && (
        <Link
          href={urlgen('projects/[projectId]', { projectId: `${projectId}` })}
          className={styles.backLink}
        >
          ← Back to Project Detail
        </Link>
      )}

      <div className={styles.heading}>
        <h1 className={styles.title}>{migration.title}</h1>
        <p className={styles.subTitle}>#{migration.PullRequest.pullNumber}</p>
      </div>
      <div className={styles.twoColumns}>
        <div className={styles.box}>
          <h2 className={styles.h2}>Migration Health</h2>
          <div className={styles.healthContent}>
            {overallReview.reviewScores.length > 0 ? (
              <div className={styles.radarChartContainer}>
                <RadarChart
                  scores={overallReview.reviewScores.map((score) => ({
                    id: score.id,
                    overallReviewId: score.overallReviewId,
                    overallScore: score.overallScore,
                    category: score.category as CategoryEnum,
                  }))}
                />
              </div>
            ) : (
              <p className={styles.noScores}>No review scores found.</p>
            )}
            <div className={styles.erdLinks}>
              {erdLinks.map(({ path, filename }) => (
                <Link key={path} href={path} className={styles.erdLink}>
                  View ERD Diagram: {filename} →
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.box}>
          <h2 className={styles.h2}>Summary</h2>
        </div>
        <div className={styles.box}>
          <h2 className={styles.h2}>Review Content</h2>
          {overallReview.reviewComment ? (
            <>
              <pre className={styles.reviewContent}>
                {overallReview.reviewComment}
              </pre>
              {overallReview.traceId && (
                <div className={styles.feedbackSection}>
                  <UserFeedbackClient traceId={overallReview.traceId} />
                </div>
              )}
            </>
          ) : (
            <p className={styles.noContent}>No review content found.</p>
          )}
        </div>
        <div className={styles.box}>
          <h2 className={styles.h2}>Review Issues</h2>
          <div className={styles.reviewIssues}>
            {overallReview.reviewIssues.length > 0 ? (
              [...overallReview.reviewIssues]
                .sort((a, b) => {
                  const severityOrder = {
                    CRITICAL: 0,
                    WARNING: 1,
                    POSITIVE: 2,
                  }
                  return (
                    severityOrder[a.severity as keyof typeof severityOrder] -
                    severityOrder[b.severity as keyof typeof severityOrder]
                  )
                })
                .map(
                  (issue: {
                    id: number
                    category: string
                    severity: string
                    description: string
                    suggestion: string
                  }) => (
                    <div
                      key={issue.id}
                      className={clsx(
                        styles.reviewIssue,
                        styles[`severity${issue.severity}`],
                      )}
                    >
                      <div className={styles.issueHeader}>
                        <span className={styles.issueCategory}>
                          {issue.category}
                        </span>
                        <span className={styles.issueSeverity}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className={styles.issueDescription}>
                        {issue.description}
                      </p>
                      {issue.suggestion && (
                        <div className={styles.issueSuggestion}>
                          <h4 className={styles.suggestionTitle}>
                            💡 Suggestion:
                          </h4>
                          <p>{issue.suggestion}</p>
                        </div>
                      )}
                    </div>
                  ),
                )
            ) : (
              <p className={styles.noIssues}>No review issues found.</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.metadataSection}>
        <p className={styles.metadata}>Review Date: {formattedReviewDate}</p>
      </div>
    </main>
  )
}
