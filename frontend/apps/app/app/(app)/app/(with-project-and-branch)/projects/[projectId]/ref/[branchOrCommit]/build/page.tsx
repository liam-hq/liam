import type { PageProps } from '@/app/types'
import { BuildPage } from '@/features/projects/pages/BuildPage'
import { branchOrCommitSchema } from '@/utils/routes'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  return (
    <BuildPage
      projectId={parsedParams.output.projectId}
      branchOrCommit={parsedParams.output.branchOrCommit}
    />
  )
}
