import { notFound } from 'next/navigation'
import * as v from 'valibot'
import type { PageProps } from '@/app/types'
import { BranchDetailPage } from '@/components/BranchDetailPage'
import { branchOrCommitSchema } from '@/libs/routes'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) notFound()

  const { projectId, branchOrCommit } = parsedParams.output
  return (
    <BranchDetailPage projectId={projectId} branchOrCommit={branchOrCommit} />
  )
}
