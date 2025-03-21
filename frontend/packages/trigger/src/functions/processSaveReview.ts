import { prisma } from '@liam-hq/db'
import type { ReviewResponse } from '../types'

export const processSaveReview = async (payload: ReviewResponse): Promise<void> => {
  try {
    const { reviewComment, pullRequestId } = payload

    // Save review to database
    await prisma.review.create({
      data: {
        content: reviewComment,
        pullRequestId,
      },
    })

    console.log(`Review saved for PR ${pullRequestId}`)
  } catch (error) {
    console.error('Error in processSaveReview:', error)
    throw error
  }
} 