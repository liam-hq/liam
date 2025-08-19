import type { Schema } from '@liam-hq/schema'
import { schemaSchema } from '@liam-hq/schema'
import { err, ok, type Result } from 'neverthrow'
import type { FC } from 'react'
import { safeParse } from 'valibot'
import { checkPublicShareStatus } from '@/features/public-share/actions'
import { ViewModeProvider } from './contexts/ViewModeContext'
import { SessionDetailPageClient } from './SessionDetailPageClient'
import { getBuildingSchema } from './services/buildingSchema/server/getBuildingSchema'
import { buildPrevSchema } from './services/buildPrevSchema/server/buildPrevSchema'
import { getDesignSessionWithTimelineItems } from './services/designSessionWithTimelineItems/server/getDesignSessionWithTimelineItems'
import { getVersions } from './services/getVersions'
import { getWorkflowRunStatus } from './services/workflowRuns/server/getWorkflowRunStatus'
import type { DesignSessionWithTimelineItems, Version } from './types'

type Props = {
  designSessionId: string
  isDeepModelingEnabled: boolean
}

async function loadSessionData(designSessionId: string): Promise<
  Result<
    {
      designSessionWithTimelineItems: DesignSessionWithTimelineItems
      buildingSchema: NonNullable<Awaited<ReturnType<typeof getBuildingSchema>>>
      initialSchema: Schema
    },
    Error
  >
> {
  const designSessionWithTimelineItems =
    await getDesignSessionWithTimelineItems(designSessionId)

  if (!designSessionWithTimelineItems) {
    return err(new Error('Design session not found'))
  }

  const buildingSchema = await getBuildingSchema(designSessionId)
  if (!buildingSchema) {
    return err(new Error('Building schema not found for design session'))
  }

  const parsedSchema = safeParse(schemaSchema, buildingSchema.schema)
  const initialSchema = parsedSchema.success ? parsedSchema.output : null

  if (!initialSchema) {
    return err(new Error('Invalid schema format'))
  }

  return ok({
    designSessionWithTimelineItems,
    buildingSchema,
    initialSchema,
  })
}

export const SessionDetailPage: FC<Props> = async ({
  designSessionId,
  isDeepModelingEnabled,
}) => {
  const result = await loadSessionData(designSessionId)

  if (result.isErr()) {
    throw result.error
  }

  const { designSessionWithTimelineItems, buildingSchema, initialSchema } =
    result.value

  const versions = await getVersions(buildingSchema.id)
  const latestVersion: Version | undefined = versions[0]
  const initialPrevSchema = latestVersion
    ? ((await buildPrevSchema({
        currentSchema: initialSchema,
        currentVersionId: latestVersion.id,
      })) ?? initialSchema)
    : initialSchema

  const initialWorkflowRunStatus = await getWorkflowRunStatus(designSessionId)

  // Fetch initial public share status
  const { isPublic: initialIsPublic } =
    await checkPublicShareStatus(designSessionId)

  return (
    <ViewModeProvider mode="private">
      <SessionDetailPageClient
        buildingSchemaId={buildingSchema.id}
        designSessionWithTimelineItems={designSessionWithTimelineItems}
        initialDisplayedSchema={initialSchema}
        initialPrevSchema={initialPrevSchema}
        initialVersions={versions}
        initialWorkflowRunStatus={initialWorkflowRunStatus}
        isDeepModelingEnabled={isDeepModelingEnabled}
        initialIsPublic={initialIsPublic}
      />
    </ViewModeProvider>
  )
}
