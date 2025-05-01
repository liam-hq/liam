import type { PageProps } from '@/app/types'
import { BranchDetailPage } from '@/features/projects/pages/BranchDetailPage/BranchDetailPage'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: v.string(),
  commit: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    throw new Error('Invalid parameters')
  }

  const { projectId, commit } = parsedParams.output

  // Use the commit as the branchOrCommit parameter for BranchDetailPage
  return <BranchDetailPage projectId={projectId} branchOrCommit={commit} />
}
