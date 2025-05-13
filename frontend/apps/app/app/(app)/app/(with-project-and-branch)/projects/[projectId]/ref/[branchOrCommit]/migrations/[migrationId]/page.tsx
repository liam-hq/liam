import type { PageProps } from '@/app/types'
import { MigrationDetailPage } from '@/components/MigrationDetailPage'
import { branchOrCommitSchema } from '@/libs/routes'

import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
  migrationId: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const { projectId, branchOrCommit, migrationId } = parsedParams.output

  return (
    <MigrationDetailPage
      projectId={projectId}
      branchOrCommit={branchOrCommit}
      migrationId={migrationId}
    />
  )
}
