'use server'

import { type SupabaseClient, createClient } from '@/libs/db/server'
import type { Tables } from '@liam-hq/db/supabase/database.types'
import { generateKnowledgeFromFeedbackTask } from '@liam-hq/jobs'
import type { Review } from '@liam-hq/jobs/src/types'
import * as v from 'valibot'

type ReviewFeedback = Tables<'review_feedbacks'>

type KindEnum =
  | 'Migration Safety'
  | 'Data Integrity'
  | 'Performance Impact'
  | 'Project Rules Consistency'
  | 'Security or Scalability'

function categoryToKind(category: string | null | undefined): KindEnum {
  if (!category) return 'Migration Safety' // Default value

  const mapping: Record<string, KindEnum> = {
    MIGRATION_SAFETY: 'Migration Safety',
    DATA_INTEGRITY: 'Data Integrity',
    PERFORMANCE_IMPACT: 'Performance Impact',
    PROJECT_RULES_CONSISTENCY: 'Project Rules Consistency',
    SECURITY_OR_SCALABILITY: 'Security or Scalability',
  }

  return mapping[category] || 'Migration Safety'
}

const requestSchema = v.object({
  feedbackId: v.pipe(v.string()),
  resolutionComment: v.optional(v.nullable(v.string())),
})

/**
 * Fetches feedback data with related information
 */
async function getFeedbackData(supabase: SupabaseClient, feedbackId: string) {
  const { data, error } = await supabase
    .from('review_feedbacks')
    .select(`
      *,
      overallReview:overall_review_id(
        id,
        migration:migration_id(
          id,
          project_id,
          migration_pull_request_mappings(
            pull_request_id,
            pullRequest:pull_request_id(
              id,
              repository_id,
              pull_number,
              repository:repository_id(
                owner,
                name,
                github_installation_identifier
              )
            )
          )
        ),
        branch_name
      )
    `)
    .eq('id', feedbackId)
    .single()

  if (error || !data) {
    throw new Error(
      `Failed to fetch feedback data: ${error?.message || 'Not found'}`,
    )
  }

  return data
}

/**
 * Updates feedback to mark it as resolved
 */
async function updateFeedbackAsResolved(
  supabase: SupabaseClient,
  feedbackId: string,
  resolutionComment?: string | null,
) {
  const { data, error } = await supabase
    .from('review_feedbacks')
    .update({
      resolved_at: new Date().toISOString(),
      resolution_comment: resolutionComment || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', feedbackId)
    .select()

  if (error) {
    throw new Error(`Failed to resolve feedback: ${error.message}`)
  }

  return data
}

/**
 * Fetches complete OverallReview data with migration details
 */
async function getCompleteOverallReview(
  supabase: SupabaseClient,
  overallReviewId: string,
) {
  const { data, error } = await supabase
    .from('overall_reviews')
    .select(`
      *,
      migration:migration_id(
        id,
        project_id
      )
    `)
    .eq('id', overallReviewId)
    .single()

  if (error || !data) {
    throw new Error(
      `Failed to fetch complete OverallReview: ${error?.message || 'Not found'}`,
    )
  }

  if (!data.migration || !data.migration.project_id) {
    throw new Error('Project ID not found in associated migration')
  }

  return data
}

/**
 * Formats feedback data into review format
 */
function formatReviewFromFeedback(feedback: ReviewFeedback): Review {
  return {
    bodyMarkdown: feedback.description || '',
    feedbacks: [
      {
        kind: categoryToKind(feedback.category),
        severity: feedback.severity,
        description: feedback.description || '',
        suggestion: feedback.suggestion || '',
        suggestionSnippets: [],
      },
    ],
  }
}

/**
 * Fetches and adds snippet data to the review
 */
async function addSnippetsToReview(
  supabase: SupabaseClient,
  feedbackId: string,
  review: Review,
): Promise<Review> {
  const { data, error } = await supabase
    .from('review_suggestion_snippets')
    .select('*')
    .eq('reviewFeedbackId', feedbackId)

  if (error) {
    console.warn(`Error fetching snippets: ${error.message}`)
    return review
  }

  if (data && data.length > 0) {
    review.feedbacks[0].suggestionSnippets = data.map(
      (snippet: { filename: string; snippet: string }) => ({
        filename: snippet.filename,
        snippet: snippet.snippet,
      }),
    )
  }

  return review
}

/**
 * Main function to resolve review feedback and generate knowledge if needed
 */
export const resolveReviewFeedback = async (data: {
  feedbackId: string
  resolutionComment?: string | null
}) => {
  // Validate input data
  const parsedData = v.safeParse(requestSchema, data)
  if (!parsedData.success) {
    throw new Error(`Invalid data: ${JSON.stringify(parsedData.issues)}`)
  }

  const { feedbackId, resolutionComment } = parsedData.output
  let taskId: string | null = null

  const supabase = await createClient()

  // Get feedback data
  const feedbackData = await getFeedbackData(supabase, feedbackId)

  // Update feedback as resolved
  const updatedFeedback = await updateFeedbackAsResolved(
    supabase,
    feedbackId,
    resolutionComment,
  )

  // Skip knowledge generation for POSITIVE feedback
  if (updatedFeedback[0].severity === 'POSITIVE') {
    return { success: true, data: updatedFeedback, taskId: null }
  }

  // Get complete OverallReview data
  const completeOverallReview = await getCompleteOverallReview(
    supabase,
    feedbackData.overall_review_id,
  )

  // Format review from feedback
  let reviewFormatted = formatReviewFromFeedback(updatedFeedback[0])

  // Add snippets to review
  reviewFormatted = await addSnippetsToReview(
    supabase,
    feedbackId,
    reviewFormatted,
  )

  // Trigger knowledge generation task
  const taskHandle = await generateKnowledgeFromFeedbackTask.trigger({
    projectId: completeOverallReview.migration.project_id || '',
    review: reviewFormatted,
    title: `Knowledge from resolved feedback #${feedbackId}`,
    reasoning: `This knowledge suggestion was automatically created from resolved feedback #${feedbackId}`,
    overallReview: completeOverallReview,
    branch: completeOverallReview.branch_name,
    reviewFeedbackId: feedbackId,
  })

  taskId = taskHandle.id

  return { success: true, data: updatedFeedback, taskId }
}
