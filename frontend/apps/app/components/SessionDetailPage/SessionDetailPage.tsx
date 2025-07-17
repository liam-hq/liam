import { schemaSchema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { safeParse } from 'valibot'
import { SessionDetailPageClient } from './SessionDetailPageClient'
import { getBuildingSchema } from './services/buildingSchema/server/getBuildingSchema'
import { buildPrevSchema } from './services/buildPrevSchema/server/buildPrevSchema'
import { getDesignSessionWithTimelineItems } from './services/designSessionWithTimelineItems/server/getDesignSessionWithTimelineItems'
import { getVersions } from './services/getVersions'
import { getWorkflowRunStatus } from './services/workflowRuns/server/getWorkflowRunStatus'
import type { Version } from './types'

type Props = {
  designSessionId: string
}

export const SessionDetailPage: FC<Props> = async ({ designSessionId }) => {
  const designSessionWithTimelineItems =
    await getDesignSessionWithTimelineItems(designSessionId)

  if (!designSessionWithTimelineItems) {
    throw new Error('Design session not found')
  }

  const buildingSchema = await getBuildingSchema(designSessionId)
  if (!buildingSchema) {
    throw new Error('Building schema not found for design session')
  }

  const parsedSchema = safeParse(schemaSchema, buildingSchema.schema)
  const initialSchema = parsedSchema.success ? parsedSchema.output : null

  const versions = await getVersions(buildingSchema.id)
  const latestVersion: Version | undefined = versions[0]
  const initialPrevSchema =
    initialSchema !== null && latestVersion !== undefined
      ? await buildPrevSchema({
          currentSchema: initialSchema,
          currentVersionId: latestVersion.id,
        })
      : null

  const initialWorkflowRunStatus = await getWorkflowRunStatus(designSessionId)

  return (
    <SessionDetailPageClient
      buildingSchemaId={buildingSchema.id}
      designSessionWithTimelineItems={designSessionWithTimelineItems}
      initialDisplayedSchema={initialSchema}
      initialPrevSchema={initialPrevSchema}
      initialVersions={versions}
      initialWorkflowRunStatus={initialWorkflowRunStatus}
    />
  )
}
