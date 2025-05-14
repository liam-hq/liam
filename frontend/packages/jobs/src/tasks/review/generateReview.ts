import { logger, task } from '@trigger.dev/sdk/v3'
import { v4 as uuidv4 } from 'uuid'
import { generateReview } from '../../functions/generateReview'
import { createClient } from '../../libs/supabase'
import type { Review } from '../../types'
import type { GenerateReviewPayload } from '../../types'
// We'll create saveReview.ts next, so this import will work after that
import { saveReviewTask } from './saveReview'

export type ReviewResponse = {
  review: Review
  projectId: string
  pullRequestId: string
  repositoryId: string
  branchName: string
  traceId: string
  pullRequestNumber: number
  owner: string
  name: string
}

const processGenerateReview = async (
  payload: GenerateReviewPayload,
): Promise<{ review: Review; traceId: string }> => {
  const supabase = createClient()

  const { data: repository, error: repositoryError } = await supabase
    .from('github_repositories')
    .select('github_installation_identifier')
    .eq('id', payload.repositoryId)
    .single()

  if (repositoryError || !repository) {
    throw new Error(
      `Repository with ID ${payload.repositoryId} not found: ${JSON.stringify(repositoryError)}`,
    )
  }

  const predefinedRunId = uuidv4()

  const review = await generateReview()

  return { review: review, traceId: predefinedRunId }
}

export const generateReviewTask = task({
  id: 'generate-review',
  run: async (payload: GenerateReviewPayload) => {
    const { review, traceId } = await processGenerateReview(payload)
    logger.log('Generated review:', { review })
    await saveReviewTask.trigger({
      review,
      traceId,
      ...payload,
    })
    return { review }
  },
})
