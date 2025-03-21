import { prisma } from '@liam-hq/db'
import type { Prisma } from '@prisma/client'
import type { ReviewResponse } from '../types'

export async function processSaveReview(
  payload: ReviewResponse,
): Promise<{ success: boolean }> {
  try {
    const pullRequest = await prisma.pullRequest.findFirst({
      where: {
        id: payload.pullRequestId,
      },
    })

    if (!pullRequest) {
      throw new Error('PullRequest not found')
    }

    // create overall review
    await prisma.overallReview.create({
      data: {
        ...(payload.projectId
          ? {
              project: {
                connect: {
                  id: payload.projectId,
                },
              },
            }
          : {}),
        pullRequest: {
          connect: {
            id: pullRequest.id,
          },
        },
        reviewComment: payload.reviewComment,
      } as Prisma.OverallReviewCreateInput,
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error saving review:', error)
    throw error
  }
}
