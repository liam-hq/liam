import type { PageProps } from '@/app/types'
import { branchOrCommitSchema } from '@/utils/routes'
import { notFound } from 'next/navigation'
import * as v from 'valibot'
import { DocsListPage } from './DocsListPage'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return notFound()

  const { projectId, branchOrCommit } = parsedParams.output

  return <DocsListPage projectId={projectId} branchOrCommit={branchOrCommit} />
}
