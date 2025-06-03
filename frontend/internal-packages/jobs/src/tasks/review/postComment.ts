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
  projectId: string
  pullRequestId: string
  repositoryId: string
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
  installationId: number
  owner: string
  repo: string
  pullNumber: string | number
  projectId: string
  branchRef: string
}): Promise<string> {
  const supabase = createClient()

  const { data: schemaPath, error } = await supabase
    .from('schema_file_paths')
    .select('path')
    .eq('project_id', projectId)
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
  const { reviewComment, pullRequestId, repositoryId, projectId, branchName } =
    payload
  const supabase = createClient()

  const { data: repository, error: repoError } = await supabase
    .from('github_repositories')
    .select('*')
    .eq('id', repositoryId)
    .single()

  if (repoError || !repository) {
    throw new Error(
      `Repository with ID ${repositoryId} not found: ${repoError?.message}`,
    )
  }

  const installationId = repository.github_installation_identifier
  const owner = repository.owner
  const repo = repository.name

  const { data: prRecord, error: prError } = await supabase
    .from('github_pull_requests')
    .select('*')
    .eq('id', pullRequestId)
    .single()

  if (prError || !prRecord) {
    throw new Error(
      `Pull request with ID ${pullRequestId} not found: ${prError?.message}`,
    )
  }

  // Get the migration through the mapping table
  const { data: mappingRecord, error: mappingError } = await supabase
    .from('migration_pull_request_mappings')
    .select('migration_id')
    .eq('pull_request_id', pullRequestId)
    .maybeSingle()

  if (mappingError || !mappingRecord) {
    throw new Error(
      `Migration for Pull request with ID ${pullRequestId} not found`,
    )
  }

  // Fetch the migration using the migration_id from the mapping
  const { data: migration, error: migrationError } = await supabase
    .from('migrations')
    .select('id')
    .eq('id', mappingRecord.migration_id)
    .single()

  if (migrationError || !migration) {
    throw new Error(
      `Migration with ID ${mappingRecord.migration_id} not found: ${migrationError?.message}`,
    )
  }

  // Fetch comment ID from github_pull_request_comments if exists
  const { data: commentRecord } = await supabase
    .from('github_pull_request_comments')
    .select('github_comment_identifier')
    .eq('github_pull_request_id', pullRequestId)
    .maybeSingle()
  const migrationUrl = `${process.env['NEXT_PUBLIC_BASE_URL']}/app/projects/${projectId}/ref/${encodeURIComponent(branchName)}/migrations/${migration.id}`

  const prDetails = await getPullRequestDetails(
    Number(installationId),
    owner,
    repo,
    Number(prRecord.pull_number),
  )

  const erdLinkText = await generateERDLink({
    installationId,
    owner,
    repo,
    pullNumber: prRecord.pull_number,
    projectId,
    branchRef: prDetails.head.ref,
  })

  const fullComment = `${reviewComment}\n\nMigration URL: ${migrationUrl}${erdLinkText}`

  if (commentRecord?.github_comment_identifier) {
    await updatePullRequestComment(
      Number(installationId),
      owner,
      repo,
      Number(commentRecord.github_comment_identifier),
      fullComment,
    )
  } else {
    const commentResponse = await createPullRequestComment(
      Number(installationId),
      owner,
      repo,
      Number(prRecord.pull_number),
      fullComment,
    )

    const now = new Date().toISOString()
    const { error: createCommentError } = await supabase
      .from('github_pull_request_comments')
      .insert({
        github_pull_request_id: pullRequestId,
        github_comment_identifier: commentResponse.id,
        updated_at: now,
      })

    if (createCommentError) {
      throw new Error(
        `Failed to create github_pull_request_comments record: ${createCommentError.message}`,
      )
    }
  }

  return {
    success: true,
    message: 'Review comment posted successfully',
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
