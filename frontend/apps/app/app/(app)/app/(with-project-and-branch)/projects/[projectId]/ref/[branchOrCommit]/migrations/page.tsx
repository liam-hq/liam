import type { PageProps } from '@/app/types'
import { MigrationsListPage } from '@/components/MigrationsListPage'
import { branchOrCommitSchema } from '@/libs/routes/paramsSchema'

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
    <MigrationsListPage projectId={projectId} branchOrCommit={branchOrCommit} />
  )
}
