import type { PageProps } from '@/app/types'
import { SessionDetailPage } from '@/components/SessionDetailPage'
import { fetchSchemaData } from '@/components/SessionDetailPage/services/fetchSchemaData'
import type { Schema } from '@liam-hq/db-structure'
import * as v from 'valibot'

const paramsSchema = v.object({
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

  const schema: Schema = schemaData?.schema as Schema

  return (
    <SessionDetailPage
      schema={schema}
      designSessionId={parsedParams.output.id}
    />
  )
}
