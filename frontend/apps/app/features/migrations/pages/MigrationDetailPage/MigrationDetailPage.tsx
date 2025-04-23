import { createClient } from '@/libs/db/server'
import { urlgen } from '@/utils/routes'
import { getPullRequestDetails, getPullRequestFiles } from '@liam-hq/github'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import { CopyButton } from '../../../../components/CopyButton/CopyButton'
import { UserFeedbackClient } from '../../../../components/UserFeedbackClient'
import { MigrationHealthClient } from '../../components/MigrationHealthClient/MigrationHealthClient'
import { ReviewFeedbackList } from '../../components/ReviewFeedbackList/ReviewFeedbackList'
import { ReviewFeedbackProvider } from '../../contexts/ReviewFeedbackContext'
import { formatAllReviewFeedbacks } from '../../utils/formatReviewFeedback'
import styles from './MigrationDetailPage.module.css'

type Props = {
  migrationId: string
  projectId: string
  branchOrCommit: string
}

async function getMigrationContents(migrationId: string) {
  const supabase = await createClient()

  // Get migration with the related pull request using the mapping table
  const { data: migration, error: migrationError } = await supabase
    .from('migrations')
    .select(`
      id,
      title,
      created_at,
      project_id
    `)
    .eq('id', migrationId)
    .single()

  if (migrationError || !migration) {
    console.error('Error fetching migration:', migrationError)
    return notFound()
  }

  // Get the related pull request through the mapping table
  const { data: mappingData, error: mappingError } = await supabase
    .from('migration_pull_request_mappings')
    .select(`
      pull_request_id,
      github_pull_requests (
        id,
        pull_number,
        repository_id,
        github_repositories (
          id,
          github_installation_identifier,
          name,
          owner
        )
      )
    `)
    .eq('migration_id', migrationId)
    .maybeSingle()

  if (mappingError || !mappingData) {
    console.warn('No pull request mapping found for migration:', migrationId)
    return {
      migration,
      pullRequest: null,
      repository: null,
      overallReview: {
        id: null,
        project_id: migration.project_id,
        review_comment: null,
        reviewed_at: null,
        review_feedbacks: [],
      },
      erdLinks: [],
      knowledgeSuggestions: [],
    }
  }

  const pullRequest = mappingData.github_pull_requests
  const repository = pullRequest.github_repositories

  const { data: overallReview, error: reviewError } = await supabase
    .from('overall_reviews')
    .select(`
      *,
      review_feedbacks (
        id,
        category,
        severity,
        description,
        suggestion,
        resolved_at,
        resolution_comment,
        created_at,
        updated_at,
        overall_review_id,
        review_suggestion_snippets (
          id,
          filename,
          snippet
        )
      )
    `)
    .eq('pull_request_id', pullRequest.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const prDetails = await getPullRequestDetails(
    repository.github_installation_identifier,
    repository.owner,
    repository.name,
    pullRequest.pull_number,
  )

  const files = await getPullRequestFiles(
    repository.github_installation_identifier,
    repository.owner,
    repository.name,
    pullRequest.pull_number,
  )

  // If there's no overallReview, return with empty review data
  if (reviewError || !overallReview) {
    console.info('No OverallReview found for migration:', migrationId)
    return {
      migration,
      pullRequest,
      repository,
      overallReview: {
        id: null,
        project_id: null,
        review_comment: null,
        reviewed_at: null,
        review_feedbacks: [],
      },
      erdLinks: [],
      knowledgeSuggestions: [],
    }
  }

  const { data: schemaPath, error: pathError } = await supabase
    .from('github_schema_file_paths')
    .select('path')
    .eq('project_id', overallReview.project_id || '')
    .single()

  if (pathError) {
    console.warn(
      `No schema path found for project ${overallReview.project_id}: ${JSON.stringify(pathError)}`,
    )
    return {
      migration,
      overallReview,
      erdLinks: [],
      knowledgeSuggestions: [],
    }
  }

  const matchedFiles = files
    .map((file) => file.filename)
    .filter((filename) => filename === schemaPath.path)

  const erdLinks = matchedFiles.map((filename) => ({
    path: urlgen(
      'projects/[projectId]/ref/[branchOrCommit]/schema/[...schemaFilePath]',
      {
        projectId: `${overallReview.project_id}`,
        branchOrCommit: prDetails.head.ref,
        schemaFilePath: filename,
      },
    ),
    filename,
  }))

  // Fetch related KnowledgeSuggestions through the mapping table
  const { data: knowledgeSuggestions = [] } = await supabase
    .from('overall_review_knowledge_suggestion_mappings')
    .select(`
      knowledge_suggestion_id,
      knowledge_suggestions (
        id,
        type,
        title,
        path,
        content,
        project_id,
        branch_name,
        created_at,
        updated_at,
        approved_at,
        file_sha,
        trace_id
      )
    `)
    .eq('overall_review_id', overallReview.id)
    .order('created_at', { ascending: false })

  // Map the result to extract the knowledgeSuggestion property from each item
  const mappedKnowledgeSuggestions = (knowledgeSuggestions || [])
    .map((item) => item.knowledge_suggestions)
    .filter((suggestion) => !!suggestion)

  return {
    migration,
    pullRequest,
    repository,
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
    pullRequest,
    overallReview,
    erdLinks,
    knowledgeSuggestions = [],
  } = await getMigrationContents(migrationId)

  const formattedReviewDate = overallReview.reviewed_at
    ? new Date(overallReview.reviewed_at).toLocaleDateString('en-US')
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
        {pullRequest && (
          <p className={styles.subTitle}>#{pullRequest.pull_number}</p>
        )}
      </div>
      <div className={styles.twoColumns}>
        <ReviewFeedbackProvider
          initialFeedbacks={overallReview.review_feedbacks}
        >
          <div className={styles.box}>
            <h2 className={styles.h2}>Migration Health</h2>
            <div className={styles.healthContent}>
              <MigrationHealthClient className={styles.radarChartContainer} />
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
            {overallReview.review_comment ? (
              <>
                <pre className={styles.reviewContent}>
                  {overallReview.review_comment}
                </pre>
                {overallReview.trace_id && (
                  <div>
                    <UserFeedbackClient traceId={overallReview.trace_id} />
                  </div>
                )}
              </>
            ) : (
              <p>No review content found.</p>
            )}
          </div>
          <div className={styles.box}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.h2}>Review Feedbacks</h2>
              {overallReview.review_feedbacks.filter(
                (feedback) =>
                  feedback.severity === 'CRITICAL' && !feedback.resolved_at,
              ).length > 0 && (
                <CopyButton
                  text={formatAllReviewFeedbacks(
                    overallReview.review_feedbacks,
                  )}
                  className={styles.headerCopyButton}
                />
              )}
            </div>
            <ReviewFeedbackList />
          </div>
        </ReviewFeedbackProvider>

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
                            branchOrCommit: suggestion.branch_name || 'main',
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
