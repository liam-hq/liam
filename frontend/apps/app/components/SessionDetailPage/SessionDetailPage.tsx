import { schemaSchema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { safeParse } from 'valibot'
import { SessionDetailPageClient } from './SessionDetailPageClient'
import { getBuildingSchema } from './services/buildingSchema/server/getBuildingSchema'
import { buildPrevSchema } from './services/buildPrevSchema/server/buildPrevSchema'
import { getDesignSessionWithTimelineItems } from './services/designSessionWithTimelineItems/server/getDesignSessionWithTimelineItems'
import { getLatestVersion } from './services/latestVersion/server/getLatestVersion'

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

  const parsedSchema = safeParse(schemaSchema, buildingSchema?.schema)
  const initialSchema = parsedSchema.success ? parsedSchema.output : null

  const latestVersion = await getLatestVersion(buildingSchema?.id ?? '')
  const initialPrevSchema =
    initialSchema !== null && latestVersion !== null
      ? await buildPrevSchema({
          currentSchema: initialSchema,
          currentVersionId: latestVersion.id,
        })
      : null

  return (
    <SessionDetailPageClient
      designSessionWithTimelineItems={designSessionWithTimelineItems}
      buildingSchemaId={buildingSchema.id}
      latestVersionNumber={latestVersion?.number}
      initialSchema={initialSchema}
      initialPrevSchema={initialPrevSchema}
      initialCurrentVersion={latestVersion}
    />
  )
}
