import { BuildPage } from '@/components/BuildPage'
import type { PageProps } from '@/app/types'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: v.string(),
})

export default function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, params)
  if (!parsedParams.success) throw new Error("Invalid route parameters")

  const { projectId, branchOrCommit } = parsedParams.output

  return <BuildPage projectId={projectId} branchOrCommit={branchOrCommit} />
}
