import type { PageProps } from '@/app/types'
import { SessionsNewPage } from '@/components/SessionsNewPage'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  return <SessionsNewPage projectId={parsedParams.output.projectId} />
}
