import {
  createPullRequestComment,
  getPullRequestDetails,
  getPullRequestFiles,
  updatePullRequestComment,
} from '@liam-hq/github'
import { createClient } from '../libs/supabase'
import type { PostCommentPayload } from '../types'

/**
 * Generate ER diagram links for schema files in a pull request
 */
async function generateERDLinks({
  installationId,
  owner,
  repo,
  pullNumber,
  repositoryId,
  branchRef,
}: {
  installationId: string | number
  owner: string
  repo: string
  pullNumber: string | number
  repositoryId: number
  branchRef: string
}): Promise<string> {
  const supabase = createClient()
  const { data: projectMappings, error: mappingsError } = await supabase
    .from('ProjectRepositoryMapping')
    .select('projectId')
    .eq('repositoryId', repositoryId)

  if (mappingsError) {
    console.error('Error fetching project mappings:', mappingsError)
    throw new Error('Project mappings not found')
  }

  const projectIds = projectMappings.map(
    (mapping: { projectId: number }) => mapping.projectId,
  )

  const { data: schemaPaths, error: pathsError } = await supabase
    .from('GitHubSchemaFilePath')
    .select('path, projectId')
    .in('projectId', projectIds)

  if (pathsError) {
    console.error('Error fetching schema paths:', pathsError)
    throw new Error('Schema paths not found')
  }

  const files = await getPullRequestFiles(
    Number(installationId),
    owner,
    repo,
    Number(pullNumber),
  )

  const matchedFiles = files
    .map((file) => file.filename)
    .filter((filename) =>
      schemaPaths.some((schemaPath) => filename === schemaPath.path),
    )

  let erdLinksText = ''
  if (matchedFiles.length > 0) {
    erdLinksText = '\n\nER Diagrams:'

    const filesByProject = new Map<number, string[]>()

    for (const filename of matchedFiles) {
      const schemaPath = schemaPaths.find((sp) => sp.path === filename)
      if (schemaPath) {
        const projectFiles = filesByProject.get(schemaPath.projectId) || []
        projectFiles.push(filename)
        filesByProject.set(schemaPath.projectId, projectFiles)
      }
    }

    for (const [projectId, filenames] of filesByProject.entries()) {
      for (const filename of filenames) {
        const encodedBranchRef = encodeURIComponent(branchRef)
        erdLinksText += `\n- View ERD for ${filename}: ${process.env['NEXT_PUBLIC_BASE_URL']}/app/projects/${projectId}/ref/${encodedBranchRef}/schema/${filename}`
      }
    }
  }

  return erdLinksText
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

    // Get repository information
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

    // Get installation ID from repository
    const installationId = repository.installationId
    const owner = repository.owner
    const repo = repository.name

    // Check if there's an existing PR record with a comment
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

    const erdLinksText = await generateERDLinks({
      installationId,
      owner,
      repo,
      pullNumber: prRecord.pullNumber,
      repositoryId: Number(repositoryId),
      branchRef: prDetails.head.ref,
    })

    const fullComment = `${reviewComment}\n\nMigration URL: ${migrationUrl}${erdLinksText}`

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
