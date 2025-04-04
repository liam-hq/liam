import type { InferOutput } from 'valibot'
import type { reviewSchema } from '../prompts/generateReview/reviewSchema'

export type SavePullRequestPayload = {
  prNumber: number
  projectId: number
}

export type GenerateReviewPayload = {
  pullRequestId: number
  projectId: number
  repositoryId: number
  branchName: string
  owner: string
  name: string
  pullRequestNumber: number
  schemaFiles: Array<{
    filename: string
    content: string
  }>
  fileChanges: Array<{
    filename: string
    status:
      | 'added'
      | 'modified'
      | 'deleted'
      | 'removed'
      | 'renamed'
      | 'copied'
      | 'changed'
      | 'unchanged'
    changes: number
    patch: string
    currentContent: string | null
  }>
}

export type Review = InferOutput<typeof reviewSchema>

export type ReviewResponse = {
  review: Review
  projectId: number
  pullRequestId: number
  repositoryId: number
  branchName: string
  traceId: string
}

export type PostCommentPayload = {
  reviewComment: string
  projectId: number
  pullRequestId: number
  repositoryId: number
  branchName: string
  traceId: string
}

export type GenerateSchemaMetaPayload = {
  overallReviewId: number
}

export type SchemaMetaResult = {
  overrides: Record<string, unknown>
  projectId: number
  pullRequestNumber: number
  branchName: string
  title: string
  traceId: string
}
