import type { PageProps } from '@/app/types'
import { DocsDetailPage } from '@/components/DocsDetailPage'

import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: v.string(),
  docFilePath: v.array(v.string()),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const { projectId, branchOrCommit, docFilePath } = parsedParams.output

  return (
    <DocsDetailPage
      projectId={projectId}
      branchOrCommit={branchOrCommit}
      docFilePath={docFilePath}
    />
  )
}
