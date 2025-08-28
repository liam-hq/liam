import { notFound } from 'next/navigation'
import * as v from 'valibot'
import type { PageProps } from '@/app/types'
import { SessionDetailPage } from '@/components/SessionDetailPage'

const paramsSchema = v.object({
  id: v.string(),
})

const searchParamsSchema = v.object({
  deepModeling: v.optional(v.string()),
})

export default async function Page({ params, searchParams }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) notFound()

  const parsedSearchParams = v.safeParse(searchParamsSchema, await searchParams)
  const isDeepModelingEnabled = parsedSearchParams.success
    ? parsedSearchParams.output.deepModeling === 'true'
    : false

  const designSessionId = parsedParams.output.id

  return (
    <SessionDetailPage
      designSessionId={designSessionId}
      isDeepModelingEnabled={isDeepModelingEnabled}
    />
  )
}
