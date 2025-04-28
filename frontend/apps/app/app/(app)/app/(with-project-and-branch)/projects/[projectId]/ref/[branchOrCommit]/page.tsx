import type { PageProps } from '@/app/types'
import { BranchDetailPage } from '@/features/projects/pages/BranchDetailPage/BranchDetailPage'
import { branchOrCommitSchema } from '@/utils/routes'

import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, params)
  if (!parsedParams.success) return null

  const { projectId, branchOrCommit } = parsedParams.output
  return (
    <BranchDetailPage projectId={projectId} branchOrCommit={branchOrCommit} />
  )
}
