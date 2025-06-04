import type { PageProps } from '@/app/types'
import { SessionDetailPage } from '@/components/SessionDetailPage'
import { fetchSchemaData } from '@/components/SessionDetailPage/services/fetchSchemaData'
import { schemaSchema } from '@liam-hq/db-structure'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  id: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const { data: schemaData, error } = await fetchSchemaData(
    parsedParams.output.id,
  )
  if (error) {
    throw new Error('Failed to fetch schema data')
  }

  const result = v.safeParse(schemaSchema, schemaData?.schema)

  if (!result.success) {
    return null
  }

  return (
    <SessionDetailPage
      projectId={parsedParams.output.projectId}
      schema={result.output}
      designSessionId={parsedParams.output.id}
    />
  )
}
