import {
  createPullRequestComment,
  updatePullRequestComment,
} from '@/libs/github/api'
import { prisma } from '@liam-hq/db'
import type { ReviewResponse } from '../types'

export async function postComment(
  payload: ReviewResponse,
): Promise<{ success: boolean; message: string }> {
  try {
    const { reviewComment, repositoryDbId, pullRequestDbId } = payload

    // Get repository information
    const repository = await prisma.repository.findUnique({
      where: {
        id: repositoryDbId,
      },
    })

    if (!repository) {
      throw new Error(`Repository with ID ${repositoryDbId} not found`)
    }

    // Check if there's an existing PR record with a comment
    const prRecord = await prisma.pullRequest.findUnique({
      where: {
        id: pullRequestDbId,
      },
    })

    if (!prRecord) {
      throw new Error(`Pull request with ID ${pullRequestDbId} not found`)
    }

    // Get installation ID from repository
    const installationId = repository.installationId
    const owner = repository.owner
    const repo = repository.name

    // If PR already has a comment, update it; otherwise create a new one
    if (prRecord.commentId) {
      await updatePullRequestComment(
        Number(installationId),
        owner,
        repo,
        Number(prRecord.commentId),
        reviewComment,
      )
    } else {
      const commentResponse = await createPullRequestComment(
        Number(installationId),
        owner,
        repo,
        Number(prRecord.pullNumber),
        reviewComment,
      )

      // Update PR record with the comment ID
      await prisma.pullRequest.update({
        where: {
          id: pullRequestDbId,
        },
        data: {
          commentId: BigInt(commentResponse.id),
        },
      })
    }

    return {
      success: true,
      message: 'Review comment posted successfully',
    }
  } catch (error) {
    console.error('Error posting comment:', error)
    throw error
  }
}
