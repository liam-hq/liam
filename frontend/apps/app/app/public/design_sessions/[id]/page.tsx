import * as v from 'valibot'
import type { PageProps } from '@/app/types'
import { PublicSessionDetailPage } from '@/components/PublicSessionDetailPage'

const paramsSchema = v.object({
  id: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    return <div>Invalid parameters</div>
  }

  const designSessionId = parsedParams.output.id

  return <PublicSessionDetailPage designSessionId={designSessionId} />
}
