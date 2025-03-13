import {
  createPullRequestComment,
  getPullRequestFiles,
  updatePullRequestComment,
} from '@/libs/github/api'
import type { GitHubWebhookPayload } from '@/types/github'
import { prisma } from '@liam-hq/db'

// deprecated
export async function handlePullRequest(
  data: GitHubWebhookPayload,
): Promise<{ success: boolean; message: string }> {
  const pullRequest = data.pull_request
  if (!pullRequest) {
    throw new Error('Pull request data is missing')
  }

  const action = data.action
  const installationId = data.installation.id
  const owner = data.repository.owner.login
  const repo = data.repository.name
  const pullNumber = pullRequest.number

  try {
    switch (action) {
      case 'opened':
      case 'synchronize':
      case 'reopened': {
        const repository = await prisma.repository.findUnique({
          where: {
            owner_name: {
              owner,
              name: repo,
            },
          },
        })

        if (!repository) {
          throw new Error(`Repository ${owner}/${repo} not found`)
        }

        const files = await getPullRequestFiles(
          installationId,
          owner,
          repo,
          pullNumber,
        )

        const prRecord = await prisma.pullRequest.findUnique({
          where: {
            repositoryId_pullNumber: {
              repositoryId: repository.id,
              pullNumber: BigInt(pullNumber),
            },
          },
        })

        // TODO: This comment is dummy to test the comment added to the pull request.
        const comment = `Your pull request is detected by Liam Migration. ${files.length} files are changed.`

        if (prRecord?.commentId) {
          await updatePullRequestComment(
            installationId,
            owner,
            repo,
            Number(prRecord.commentId),
            comment,
          )
        } else {
          const commentResponse = await createPullRequestComment(
            installationId,
            owner,
            repo,
            pullNumber,
            comment,
          )

          await prisma.pullRequest.upsert({
            where: {
              repositoryId_pullNumber: {
                repositoryId: repository.id,
                pullNumber: BigInt(pullNumber),
              },
            },
            update: {
              commentId: BigInt(commentResponse.id),
            },
            create: {
              repositoryId: repository.id,
              pullNumber: BigInt(pullNumber),
              commentId: BigInt(commentResponse.id),
            },
          })
        }

        return {
          success: true,
          message: 'Completed and comment posted',
        }
      }

      default:
        throw new Error(`Unsupported pull request action: ${action}`)
    }
  } catch (error) {
    console.error(`Error handling pull_request.${action} event:`, error)
    throw error
  }
}
