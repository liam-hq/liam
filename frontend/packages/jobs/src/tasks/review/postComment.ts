import {
  createPullRequestComment,
  getPullRequestDetails,
  getPullRequestFiles,
  updatePullRequestComment,
} from '@liam-hq/github'
import { logger, task } from '@trigger.dev/sdk/v3'
import { createClient } from '../../libs/supabase'

export type PostCommentPayload = {
  reviewComment: string
  projectId: number
  pullRequestId: number
  repositoryId: number
  branchName: string
  traceId: string
}

/**
 * Generate ER diagram link for a schema file in a pull request
 */
async function generateERDLink({
  installationId,
  owner,
  repo,
  pullNumber,
  projectId,
  branchRef,
}: {
  installationId: string | number
  owner: string
  repo: string
  pullNumber: string | number
  projectId: number
  branchRef: string
}): Promise<string> {
  const supabase = createClient()

  const { data: schemaPath, error } = await supabase
    .from('GitHubSchemaFilePath')
    .select('path')
    .eq('projectId', projectId)
    .single()

  if (error) {
    console.warn(
      `No schema path found for project ${projectId}: ${JSON.stringify(error)}`,
    )
    return ''
  }

  const files = await getPullRequestFiles(
    Number(installationId),
    owner,
    repo,
    Number(pullNumber),
  )

  const matchedFile = files.find((file) => file.filename === schemaPath.path)

  if (!matchedFile) {
    return ''
  }

  const encodedBranchRef = encodeURIComponent(branchRef)
  return `\n\nER Diagram:\n- View ERD for ${schemaPath.path}: ${process.env['NEXT_PUBLIC_BASE_URL']}/app/projects/${projectId}/ref/${encodedBranchRef}/schema/${schemaPath.path}`
}

export async function postComment(
  payload: PostCommentPayload,
): Promise<{ success: boolean; message: string }> {
  try {
    const {
      reviewComment,
      pullRequestId,
      repositoryId,
      projectId,
      branchName,
    } = payload
    const supabase = createClient()

    const { data: repository, error: repoError } = await supabase
      .from('Repository')
      .select('*')
      .eq('id', repositoryId)
      .single()

    if (repoError || !repository) {
      throw new Error(
        `Repository with ID ${repositoryId} not found: ${repoError?.message}`,
      )
    }

    const installationId = repository.installationId
    const owner = repository.owner
    const repo = repository.name

    const { data: prRecord, error: prError } = await supabase
      .from('PullRequest')
      .select(`
        *,
        Migration!Migration_pullRequestId_fkey (
          id
        )
      `)
      .eq('id', pullRequestId)
      .single()

    if (prError || !prRecord) {
      throw new Error(
        `Pull request with ID ${pullRequestId} not found: ${prError?.message}`,
      )
    }

    if (!prRecord.Migration || !prRecord.Migration[0]) {
      throw new Error(
        `Migration for Pull request with ID ${pullRequestId} not found`,
      )
    }

    const migration = prRecord.Migration[0]
    const migrationUrl = `${process.env['NEXT_PUBLIC_BASE_URL']}/app/projects/${projectId}/ref/${encodeURIComponent(branchName)}/migrations/${migration.id}`

    const prDetails = await getPullRequestDetails(
      Number(installationId),
      owner,
      repo,
      Number(prRecord.pullNumber),
    )

    const erdLinkText = await generateERDLink({
      installationId,
      owner,
      repo,
      pullNumber: prRecord.pullNumber,
      projectId,
      branchRef: prDetails.head.ref,
    })

    const fullComment = `${reviewComment}\n\nMigration URL: ${migrationUrl}${erdLinkText}`

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

      const { error: updateError } = await supabase
        .from('PullRequest')
        .update({ commentId: commentResponse.id })
        .eq('id', pullRequestId)

      if (updateError) {
        throw new Error(
          `Failed to update pull request with comment ID: ${updateError.message}`,
        )
      }
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

export const postCommentTask = task({
  id: 'post-comment',
  run: async (payload: PostCommentPayload) => {
    logger.log('Executing comment post task:', { payload })
    const result = await postComment(payload)
    return result
  },
})
