import { createDeployment, createDeploymentStatus } from '@liam-hq/github'
import { logger, task } from '@trigger.dev/sdk/v3'
import { createClient } from '../../libs/supabase'

type CreateSchemaDeploymentPayload = {
  installationId: number
  owner: string
  repo: string
  projectId: string
  branchRef: string
}

export const processCreateSchemaDeployment = async (
  payload: CreateSchemaDeploymentPayload,
): Promise<{ success: boolean }> => {
  const supabase = createClient()
  const { data: schemaPath } = await supabase
    .from('schema_file_paths')
    .select('path')
    .eq('project_id', payload.projectId)
    .single()

  if (!schemaPath) {
    logger.warn('No schema path found for project', {
      projectId: payload.projectId,
    })
    return { success: false }
  }

  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', payload.projectId)
    .single()

  if (!project) {
    logger.warn('No project found', {
      projectId: payload.projectId,
    })
    return { success: false }
  }

  const encodedBranchRef = encodeURIComponent(payload.branchRef)
  const environmentUrl = `${process.env['NEXT_PUBLIC_BASE_URL']}/app/projects/${payload.projectId}/ref/${encodedBranchRef}/schema/${schemaPath.path}`

  const envName = process.env['NEXT_PUBLIC_ENV_NAME'] || 'Preview'
  const environment = `Liam DB ${envName} - ${project.name}`
  const description = 'ER Diagram schema preview for database visualization'

  const deployment = await createDeployment(
    payload.installationId,
    payload.owner,
    payload.repo,
    {
      ref: payload.branchRef,
      environment,
      description,
    },
  )

  if (!deployment.id) {
    logger.error('Failed to create deployment: no deployment ID returned')
    return { success: false }
  }

  await createDeploymentStatus(
    payload.installationId,
    payload.owner,
    payload.repo,
    deployment.id,
    {
      state: 'success',
      environment_url: environmentUrl,
    },
  )

  return { success: true }
}

export const createSchemaDeploymentTask = task({
  id: 'create-schema-deployment',
  run: async (payload: CreateSchemaDeploymentPayload) => {
    logger.log('Executing schema deployment task:', { payload })
    const result = await processCreateSchemaDeployment(payload)
    return result
  },
})
