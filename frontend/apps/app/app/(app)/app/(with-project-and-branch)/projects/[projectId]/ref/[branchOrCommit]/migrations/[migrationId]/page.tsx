import type { PageProps } from '@/app/types'
import { MigrationDetailPage } from '@/features/migrations/pages/MigrationDetailPage'
import { branchOrCommitSchema } from '@/utils/routes'

import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
  migrationId: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return null

  const { projectId, branchOrCommit, migrationId } = parsedParams.output

  return (
    <MigrationDetailPage
      projectId={projectId}
      branchOrCommit={branchOrCommit}
      migrationId={migrationId}
    />
  )
}
