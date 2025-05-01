import type { PageProps } from '@/app/types'
import { BranchDetailPage } from '@/features/projects/pages/BranchDetailPage/BranchDetailPage'
import { branchOrCommitSchema } from '@/utils/routes'

import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const { projectId, branchOrCommit } = parsedParams.output
  return (
    <BranchDetailPage projectId={projectId} branchOrCommit={branchOrCommit} />
  )
}
