import {
  createPullRequestComment,
  updatePullRequestComment,
} from '@/libs/github/api.server'
import { prisma } from '@liam-hq/db'
import type { ReviewResponse } from '../types'

export async function postComment(
  payload: ReviewResponse,
): Promise<{ success: boolean; message: string }> {
  try {
    const { reviewComment, pullRequestId, repositoryId } = payload

    // Get repository information
    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
      },
    })

    if (!repository) {
      throw new Error(`Repository with ID ${repositoryId} not found`)
    }

    // Check if there's an existing PR record with a comment
    const prRecord = await prisma.pullRequest.findFirst({
      where: {
        id: pullRequestId,
      },
      include: {
        migration: true,
      },
    })

    if (!prRecord) {
      throw new Error(`Pull request with ID ${pullRequestId} not found`)
    }

    if (!prRecord.migration) {
      throw new Error(
        `Migration for Pull request with ID ${pullRequestId} not found`,
      )
    }

    const migration = prRecord.migration

    const migrationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/app/migrations/${migration.id}`

    // Append migration URL to the review comment
    const fullComment = `${reviewComment}\n\nMigration URL: ${migrationUrl}`

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
        fullComment,
      )
    } else {
      const commentResponse = await createPullRequestComment(
        Number(installationId),
        owner,
        repo,
        Number(prRecord.pullNumber),
        fullComment,
      )

      // Update PR record with the comment ID
      await prisma.pullRequest.update({
        where: {
          id: pullRequestId,
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
