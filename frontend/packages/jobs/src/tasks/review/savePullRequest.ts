import {
  getFileContent,
  getPullRequestDetails,
  getPullRequestFiles,
} from '@liam-hq/github'
import { logger, task } from '@trigger.dev/sdk/v3'
import { type SupabaseClient, createClient } from '../../libs/supabase'
import { generateReviewTask } from './generateReview'

type SavePullRequestPayload = {
  prNumber: number
  projectId: number
}

export type SavePullRequestResult = {
  success: boolean
  prId: number
  repositoryId: number
  schemaFile: {
    filename: string
    content: string
  }
  fileChanges: Array<{
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
  branchName: string
}

type Repository = {
  id: number
  installationId: number | string
  owner: string
  name: string
}

type FileChange = {
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
  patch?: string
}

type SchemaFile = {
  filename: string
  content: string
}

async function getRepositoryFromProjectId(
  supabase: SupabaseClient,
  projectId: number,
): Promise<Repository> {
  const { data: projectMapping, error: mappingError } = await supabase
    .from('ProjectRepositoryMapping')
    .select(`
      *,
      repository:Repository(*)
    `)
    .eq('projectId', projectId)
    .limit(1)
    .maybeSingle()

  if (mappingError || !projectMapping) {
    throw new Error(`No repository found for project ID: ${projectId}`)
  }

  return projectMapping.repository
}

async function getSchemaPathForProject(
  supabase: SupabaseClient,
  projectId: number,
): Promise<string> {
  const { data, error } = await supabase
    .from('GitHubSchemaFilePath')
    .select('path')
    .eq('projectId', projectId)
    .single()

  if (error) {
    throw new Error(
      `No schema path found for project ${projectId}: ${JSON.stringify(error)}`,
    )
  }

  return data.path
}

async function fetchSchemaFileContent(
  repository: Repository,
  schemaPath: string,
  branchRef: string,
): Promise<SchemaFile> {
  try {
    const { content } = await getFileContent(
      `${repository.owner}/${repository.name}`,
      schemaPath,
      branchRef,
      Number(repository.installationId),
    )

    if (!content) {
      throw new Error(`No content found for schema file: ${schemaPath}`)
    }

    return {
      filename: schemaPath,
      content,
    }
  } catch (error) {
    console.error(`Error fetching content for ${schemaPath}:`, error)
    throw new Error(
      `Failed to fetch schema file content: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function formatFileChangesData(
  fileChanges: FileChange[],
): SavePullRequestResult['fileChanges'] {
  return fileChanges.map((file) => ({
    filename: file.filename,
    status: file.status,
    changes: file.changes,
    patch: file?.patch || '',
  }))
}

async function getOrCreatePullRequestRecord(
  supabase: SupabaseClient,
  repositoryId: number,
  pullNumber: number,
): Promise<{ id: number }> {
  const { data: existingPR } = await supabase
    .from('PullRequest')
    .select('id')
    .eq('repositoryId', repositoryId)
    .eq('pullNumber', pullNumber)
    .maybeSingle()

  if (existingPR) {
    return existingPR
  }

  const now = new Date().toISOString()
  const { data: newPR, error: createPRError } = await supabase
    .from('PullRequest')
    .insert({
      repositoryId,
      pullNumber,
      updatedAt: now,
    })
    .select()
    .single()

  if (createPRError || !newPR) {
    throw new Error(
      `Failed to create PR record: ${JSON.stringify(createPRError)}`,
    )
  }

  return newPR
}

async function createOrUpdateMigrationRecord(
  supabase: SupabaseClient,
  pullRequestId: number,
  title: string,
): Promise<void> {
  const { data: existingMigration } = await supabase
    .from('Migration')
    .select('id')
    .eq('pullRequestId', pullRequestId)
    .maybeSingle()

  const now = new Date().toISOString()

  if (existingMigration) {
    const { error: updateMigrationError } = await supabase
      .from('Migration')
      .update({
        title,
        updatedAt: now,
      })
      .eq('id', existingMigration.id)

    if (updateMigrationError) {
      throw new Error(
        `Failed to update migration: ${JSON.stringify(updateMigrationError)}`,
      )
    }
  } else {
    const { error: createMigrationError } = await supabase
      .from('Migration')
      .insert({
        pullRequestId,
        title,
        updatedAt: now,
      })

    if (createMigrationError) {
      throw new Error(
        `Failed to create migration: ${JSON.stringify(createMigrationError)}`,
      )
    }
  }
}

export async function processSavePullRequest(
  payload: SavePullRequestPayload,
): Promise<SavePullRequestResult> {
  const supabase = createClient()

  const repository = await getRepositoryFromProjectId(
    supabase,
    payload.projectId,
  )

  const fileChanges = await getPullRequestFiles(
    Number(repository.installationId),
    repository.owner,
    repository.name,
    payload.prNumber,
  )

  const schemaPath = await getSchemaPathForProject(supabase, payload.projectId)

  const prDetails = await getPullRequestDetails(
    Number(repository.installationId),
    repository.owner,
    repository.name,
    payload.prNumber,
  )

  const schemaFile = await fetchSchemaFileContent(
    repository,
    schemaPath,
    prDetails.head.ref,
  )

  const fileChangesData = formatFileChangesData(fileChanges)

  const prRecord = await getOrCreatePullRequestRecord(
    supabase,
    repository.id,
    payload.prNumber,
  )

  await createOrUpdateMigrationRecord(supabase, prRecord.id, prDetails.title)

  return {
    success: true,
    prId: prRecord.id,
    repositoryId: repository.id,
    schemaFile,
    fileChanges: fileChangesData,
    branchName: prDetails.head.ref,
  }
}

export const savePullRequestTask = task({
  id: 'save-pull-request',
  run: async (payload: SavePullRequestPayload) => {
    logger.log('Executing PR save task:', { payload })

    try {
      const result = await processSavePullRequest(payload)
      logger.info('Successfully saved PR to database:', { prId: result.prId })

      const supabase = createClient()
      const { data: repository, error: repositoryError } = await supabase
        .from('Repository')
        .select('*')
        .eq('id', result.repositoryId)
        .single()

      if (repositoryError || !repository) {
        throw new Error(
          `Repository not found: ${JSON.stringify(repositoryError)}`,
        )
      }

      await generateReviewTask.trigger({
        pullRequestId: result.prId,
        projectId: payload.projectId,
        repositoryId: repository.id,
        branchName: result.branchName,
        owner: repository.owner,
        name: repository.name,
        pullRequestNumber: payload.prNumber,
        schemaFile: result.schemaFile,
        fileChanges: result.fileChanges,
      })

      return result
    } catch (error) {
      logger.error('Error in savePullRequest task:', { error })
      throw error
    }
  },
})
