import {
  getFileContent,
  getPullRequestDetails,
  getPullRequestFiles,
} from '@liam-hq/github'
import { createClient } from '../libs/supabase'

import type { SavePullRequestPayload } from '../types'

export type SavePullRequestResult = {
  success: boolean
  prId: number
  schemaFiles: Array<{
    filename: string
    content: string
  }>
  schemaChanges: Array<{
    filename: string
    status:
      | 'added'
      | 'modified'
      | 'deleted'
      | 'removed'
      | 'renamed'
      | 'copied'
      | 'changed'
      | 'unchanged'
    changes: number
    patch: string
  }>
}

export async function processSavePullRequest(
  payload: SavePullRequestPayload,
): Promise<SavePullRequestResult> {
  const supabase = createClient()

  // Get repository
  const { data: repository, error: repoError } = await supabase
    .from('Repository')
    .select('*')
    .eq('owner', payload.owner)
    .eq('name', payload.name)
    .single()

  if (repoError || !repository) {
    console.error('Error fetching repository:', repoError)
    throw new Error('Repository not found')
  }

  if (!repository) {
    throw new Error('Repository not found')
  }

  const fileChanges = await getPullRequestFiles(
    // bigint to number
    Number(repository.installationId.toString()),
    repository.owner,
    repository.name,
    payload.prNumber,
  )

  // Get project mappings with schema paths
  const { data: projectMappings, error: mappingsError } = await supabase
    .from('ProjectRepositoryMapping')
    .select(`
      projectId,
      Project:projectId (
        id
      )
    `)
    .eq('repositoryId', repository.id)

  if (mappingsError) {
    console.error('Error fetching project mappings:', mappingsError)
    throw new Error('Project mappings not found')
  }

  // Get schema paths for all projects
  const projectIds = projectMappings.map(
    (mapping: { projectId: number }) => mapping.projectId,
  )

  const { data: schemaPaths, error: pathsError } = await supabase
    .from('GitHubSchemaFilePath')
    .select('path')
    .in('projectId', projectIds)

  if (pathsError) {
    console.error('Error fetching schema paths:', pathsError)
    throw new Error('Schema paths not found')
  }

  const allSchemaPaths = schemaPaths || []

  const matchedFiles = fileChanges.filter((file) =>
    allSchemaPaths.some(
      (schemaPath: { path: string }) => file.filename === schemaPath.path,
    ),
  )

  const prDetails = await getPullRequestDetails(
    Number(repository.installationId),
    repository.owner,
    repository.name,
    payload.prNumber,
  )

  const schemaFiles: Array<{
    filename: string
    content: string
  }> = await Promise.all(
    matchedFiles.map(async (file) => {
      try {
        const { content } = await getFileContent(
          `${repository.owner}/${repository.name}`,
          file.filename,
          prDetails.head.ref,
          Number(repository.installationId),
        )
        return {
          filename: file.filename,
          content: content ?? '',
        }
      } catch (error) {
        console.error(`Error fetching content for ${file.filename}:`, error)
        return {
          filename: file.filename,
          content: '',
        }
      }
    }),
  )

  const schemaChanges = fileChanges.map((file) => {
    return {
      filename: file.filename,
      status: file.status,
      changes: file.changes,
      patch: file?.patch || '',
    }
  })

  // Check if PR exists
  const { data: existingPR } = await supabase
    .from('PullRequest')
    .select('id')
    .eq('repositoryId', repository.id)
    .eq('pullNumber', payload.prNumber)
    .single()

  let prId: number

  if (existingPR) {
    // Update existing PR
    prId = existingPR.id
  } else {
    // Create new PR
    const { data: newPR, error: createPRError } = await supabase
      .from('PullRequest')
      .insert({
        repositoryId: repository.id,
        pullNumber: payload.prNumber,
        updatedAt: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (createPRError || !newPR) {
      console.error('Error creating pull request:', createPRError)
      throw new Error('Failed to create pull request')
    }

    prId = newPR.id
  }

  // Check if migration exists
  const { data: existingMigration } = await supabase
    .from('Migration')
    .select('id')
    .eq('pullRequestId', prId)
    .single()

  if (existingMigration) {
    // Update existing migration
    await supabase
      .from('Migration')
      .update({
        title: payload.pullRequestTitle,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', existingMigration.id)
  } else {
    // Create new migration
    await supabase.from('Migration').insert({
      pullRequestId: prId,
      title: payload.pullRequestTitle,
      updatedAt: new Date().toISOString(),
    })
  }

  return {
    success: true,
    prId,
    schemaFiles,
    schemaChanges,
  }
}
