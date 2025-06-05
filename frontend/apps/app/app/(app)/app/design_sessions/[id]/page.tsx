import type { PageProps } from '@/app/types'
import { SessionDetailPage } from '@/components/SessionDetailPage'
import { fetchSchemaData } from '@/components/SessionDetailPage/services/fetchSchemaData'
import { schemaSchema } from '@liam-hq/db-structure'
import * as v from 'valibot'
import { fetchDesignSessionData } from './services/fetchDesignSessionData'

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

  const schemaParseResult = v.safeParse(schemaSchema, schemaResult.data?.schema)
  if (!schemaParseResult.success) {
    throw new Error('Invalid schema data')
  }

  const schema = schemaParseResult.output

  return (
    <SessionDetailPage
      schema={schema}
      designSession={{
        id: designSessionId,
        organizationId: designSessionData.organization_id,
      }}
    />
  )
}
