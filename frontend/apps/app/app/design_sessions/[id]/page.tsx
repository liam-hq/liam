import { notFound } from 'next/navigation'
import * as v from 'valibot'
import { SessionDetailPage } from '../../../components/SessionDetailPage'
import type { PageProps } from '../../types'

const paramsSchema = v.object({
  id: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) notFound()

  const designSessionId = parsedParams.output.id

  return <SessionDetailPage designSessionId={designSessionId} />
}
