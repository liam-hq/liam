import { createDeployment, createDeploymentStatus } from '@liam-hq/github'
import { logger, task } from '@trigger.dev/sdk/v3'
import { createClient } from '../../libs/supabase'

export type CreateSchemaDeploymentPayload = {
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

  const encodedBranchRef = encodeURIComponent(payload.branchRef)
  const environmentUrl = `${process.env['NEXT_PUBLIC_BASE_URL']}/app/projects/${payload.projectId}/ref/${encodedBranchRef}/schema/${schemaPath.path}`

  const deployment = (await createDeployment(
    payload.installationId,
    payload.owner,
    payload.repo,
    {
      ref: payload.branchRef,
      environment: 'Preview – liam-db',
      description: 'Liam DB schema preview',
    },
  )) as { id: number }

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
