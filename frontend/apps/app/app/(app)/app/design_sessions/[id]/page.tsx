import type { PageProps } from '@/app/types'
import { SessionDetailPage } from '@/components/SessionDetailPage'
import {
  fetchDesignSessionData,
  fetchSchemaData,
} from '@/utils/agentSupabaseHelper'
import * as v from 'valibot'

const paramsSchema = v.object({
  id: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const designSessionId = parsedParams.output.id

  // Fetch design session data and schema data in parallel
  const [designSessionData, schemaResult] = await Promise.all([
    fetchDesignSessionData(designSessionId),
    fetchSchemaData(designSessionId),
  ])

  if (!designSessionData) {
    throw new Error('Design session not found')
  }

  if (schemaResult.error) {
    throw new Error('Failed to fetch schema data')
  }

  const buildingSchemaId = schemaResult.data?.id
  const latestVersionNumber = schemaResult.data?.latestVersionNumber ?? 0

  // buildingSchemaId is required - this should never happen given 1:1 relationship
  if (!buildingSchemaId) {
    throw new Error(
      'Building schema ID not found for design session. Data integrity issue.',
    )
  }

  return (
    <SessionDetailPage
      designSession={{
        id: designSessionId,
        organizationId: designSessionData.organization_id,
        messages: designSessionData.messages,
        buildingSchemaId,
        latestVersionNumber,
      }}
    />
  )
}
