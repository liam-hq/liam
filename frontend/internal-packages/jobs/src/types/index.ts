import type { SchemaOverride } from '@liam-hq/db-structure'
import type { Tables } from '@liam-hq/db/supabase/database.types'
import type { InferOutput } from 'valibot'
import type { reviewSchema } from '../prompts/generateReview/reviewSchema'

export type GenerateReviewPayload = {
  pullRequestId: string
  projectId: string
  repositoryId: string
  branchName: string
  owner: string
  name: string
  pullRequestNumber: number
  schemaFile: {
    filename: string
    content: string
  }
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
  }>
}

export type Review = InferOutput<typeof reviewSchema>

export type GenerateSchemaOverridePayload = {
  overallReviewId: string
  review: Review
}

export type SchemaOverrideResult =
  | {
      createNeeded: true
      override: SchemaOverride
      projectId: string
      pullRequestNumber: number
      branchName: string
      title: string
      traceId: string
      overallReviewId: string
      reasoning?: string
    }
  | {
      createNeeded: false
    }

export type OverallReview = Tables<'overall_reviews'>
