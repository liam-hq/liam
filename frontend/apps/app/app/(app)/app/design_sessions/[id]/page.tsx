import * as v from 'valibot'
import type { PageProps } from '@/app/types'
import { SessionDetailPage } from '@/components/SessionDetailPage'

const paramsSchema = v.object({
  id: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const designSessionId = parsedParams.output.id

  return <SessionDetailPage designSessionId={designSessionId} />
}
