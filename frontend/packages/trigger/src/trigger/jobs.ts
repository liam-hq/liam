import { postComment } from '@/src/functions/postComment'
import { processGenerateReview } from '@/src/functions/processGenerateReview'
import { processSavePullRequest } from '@/src/functions/processSavePullRequest'
import { processSaveReview } from '@/src/functions/processSaveReview'
import { logger, task } from '@trigger.dev/sdk/v3'
import type { GenerateReviewPayload, ReviewResponse } from '../types'

export const savePullRequestTask = task({
  id: 'save-pull-request',
  run: async (payload: {
    pullRequestNumber: number
    pullRequestTitle: string
    projectId: number
    owner: string
    name: string
    repositoryId: number
  }) => {
    logger.log('Executing PR save task:', { payload })

    try {
      const result = await processSavePullRequest({
        prNumber: payload.pullRequestNumber,
        pullRequestTitle: payload.pullRequestTitle,
        owner: payload.owner,
        name: payload.name,
        repositoryId: payload.repositoryId,
      })
      logger.info('Successfully saved PR to database:', { prId: result.prId })

      // Trigger the next task in the chain - generate review
      await generateReviewTask.trigger({
        ...payload,
        pullRequestId: result.prId,
        projectId: payload.projectId,
        repositoryId: payload.repositoryId,
        schemaFiles: result.schemaFiles,
        schemaChanges: result.schemaChanges,
      })

      return result
    } catch (error) {
      logger.error('Error in savePullRequest task:', { error })
      throw error
    }
  },
})

export const generateReviewTask = task({
  id: 'generate-review',
  run: async (payload: GenerateReviewPayload) => {
    const reviewComment = await processGenerateReview(payload)
    logger.log('Generated review:', { reviewComment })
    await saveReviewTask.trigger({
      reviewComment,
      ...payload,
    })
    return { reviewComment }
  },
})

export const saveReviewTask = task({
  id: 'save-review',
  run: async (payload: ReviewResponse) => {
    logger.log('Executing review save task:', { payload })
    try {
      await processSaveReview(payload)
      await postCommentTask.trigger({
        reviewComment: payload.reviewComment,
        projectId: payload.projectId,
        pullRequestId: payload.pullRequestId,
        repositoryId: payload.repositoryId,
      })
      return { success: true }
    } catch (error) {
      console.error('Error in review process:', error)

      if (error instanceof Error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: error.constructor.name,
          },
        }
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred',
          type: 'UnknownError',
        },
      }
    }
  },
})

export const postCommentTask = task({
  id: 'post-comment',
  run: async (payload: ReviewResponse) => {
    logger.log('Executing comment post task:', { payload })
    const result = await postComment(payload)
    return result
  },
})
