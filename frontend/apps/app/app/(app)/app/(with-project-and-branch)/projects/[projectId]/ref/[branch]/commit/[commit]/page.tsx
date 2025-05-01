import type { PageProps } from '@/app/types'
import { BranchDetailPage } from '@/features/projects/pages/BranchDetailPage/BranchDetailPage'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branch: v.string(),
  commit: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const { projectId, branch, commit } = parsedParams.output
  // BranchDetailPageは既存のコンポーネントを再利用
  // branchOrCommitパラメータにはcommitを渡す
  return (
    <BranchDetailPage projectId={projectId} branchOrCommit={commit} />
  )
}
