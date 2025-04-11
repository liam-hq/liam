import { createClient } from '@/libs/db/server'
import { urlgen } from '@/utils/routes'
import { getPullRequestDetails, getPullRequestFiles } from '@liam-hq/github'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import { CopyButton } from '../../../../components/CopyButton/CopyButton'
import { UserFeedbackClient } from '../../../../components/UserFeedbackClient'
import { RadarChart } from '../../components/RadarChart/RadarChart'
import type { CategoryEnum } from '../../components/RadarChart/RadarChart'
import { ReviewIssuesList } from '../../components/ReviewIssuesList/ReviewIssuesList'
import { formatAllReviewIssues } from '../../utils/formatReviewIssue'
import styles from './MigrationDetailPage.module.css'

type Props = {
  migrationId: string
  projectId: string
  branchOrCommit: string
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
        suggestion,
        resolvedAt,
        resolutionComment,
        createdAt,
        updatedAt,
        overallReviewId,
        suggestionSnippets:ReviewSuggestionSnippet (
          id,
          filename,
          snippet
        )
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
      knowledgeSuggestions: [],
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
      knowledgeSuggestions: [],
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

  // Fetch related KnowledgeSuggestions through the mapping table
  const { data: knowledgeSuggestions = [] } = await supabase
    .from('OverallReviewKnowledgeSuggestionMapping')
    .select(`
      knowledgeSuggestionId,
      knowledgeSuggestion:knowledgeSuggestionId (
        id,
        type,
        title,
        path,
        content,
        projectId,
        branchName,
        createdAt,
        updatedAt,
        approvedAt,
        fileSha,
        traceId
      )
    `)
    .eq('overallReviewId', overallReview.id)
    .order('createdAt', { ascending: false })

  // Map the result to extract the knowledgeSuggestion property from each item
  const mappedKnowledgeSuggestions = (knowledgeSuggestions || [])
    .map((item) => item.knowledgeSuggestion)
    .filter((suggestion) => !!suggestion)

  return {
    migration,
    overallReview,
    erdLinks,
    knowledgeSuggestions: mappedKnowledgeSuggestions,
  }
}

export const MigrationDetailPage: FC<Props> = async ({
  migrationId,
  projectId,
  branchOrCommit,
}) => {
  const {
    migration,
    overallReview,
    erdLinks,
    knowledgeSuggestions = [],
  } = await getMigrationContents(migrationId)

  const formattedReviewDate = overallReview.reviewedAt
    ? new Date(overallReview.reviewedAt).toLocaleDateString('en-US')
    : 'Not reviewed yet'

  return (
    <main className={styles.wrapper}>
      <Link
        href={urlgen('projects/[projectId]/ref/[branchOrCommit]', {
          projectId,
          branchOrCommit,
        })}
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
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>Review Issues</h2>
            {overallReview.reviewIssues.filter(
              (issue) => issue.severity === 'CRITICAL' && !issue.resolvedAt,
            ).length > 0 && (
              <CopyButton
                text={formatAllReviewIssues(overallReview.reviewIssues)}
                className={styles.headerCopyButton}
              />
            )}
          </div>
          <ReviewIssuesList issues={overallReview.reviewIssues} />
        </div>

        {/* Knowledge Suggestions Section */}
        <div className={styles.box}>
          <h2 className={styles.h2}>Knowledge Suggestions</h2>
          <div className={styles.knowledgeSuggestions}>
            {knowledgeSuggestions.length > 0 ? (
              <div className={styles.suggestionList}>
                {knowledgeSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className={styles.suggestionItem}>
                    <div className={styles.suggestionHeader}>
                      <span className={styles.suggestionType}>
                        {suggestion.type}
                      </span>
                      <span className={styles.suggestionTitle}>
                        {suggestion.title}
                      </span>
                      <span className={styles.suggestionPath}>
                        {suggestion.path}
                      </span>
                    </div>
                    <div className={styles.suggestionActions}>
                      <Link
                        href={urlgen(
                          'projects/[projectId]/ref/[branchOrCommit]/knowledge-suggestions/[id]',
                          {
                            projectId: `${projectId}`,
                            branchOrCommit: suggestion.branchName || 'main',
                            id: `${suggestion.id}`,
                          },
                        )}
                        className={styles.viewButton}
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noSuggestions}>
                No knowledge suggestions found.
              </p>
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
