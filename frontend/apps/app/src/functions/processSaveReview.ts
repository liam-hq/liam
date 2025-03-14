import { prisma } from '@liam-hq/db'
import type { ReviewResponse } from '../types'

export async function processSaveReview(
  payload: ReviewResponse,
): Promise<{ success: boolean }> {
  try {
    const pullRequest = await prisma.pullRequest.findUnique({
      where: {
        id: payload.pullRequestDbId,
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
        pullRequestId: payload.pullRequestDbId,
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
