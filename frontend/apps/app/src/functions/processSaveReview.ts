import { prisma } from '@liam-hq/db'
import type { ReviewResponse } from '../types'

export async function processSaveReview(
  payload: ReviewResponse,
): Promise<{ success: boolean }> {
  try {
    // TODO:find pull request by pull request id
    const pullRequest = await prisma.pullRequest.findUnique({
      where: {
        repositoryId_pullNumber: {
          repositoryId: payload.repositoryDbId,
          pullNumber: payload.pullRequestNumber,
        },
      },
    })

    if (!pullRequest) {
      throw new Error('PullRequest not found')
    }

    if (payload.projectId === undefined) {
      throw new Error('ProjectId is required')
    }

    // create overall review
    await prisma.overallReview.create({
      data: {
        projectId: payload.projectId,
        pullRequestId: pullRequest.id,
        reviewComment: payload.reviewComment,
      },
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error saving review:', error)
    throw error
  }
}
