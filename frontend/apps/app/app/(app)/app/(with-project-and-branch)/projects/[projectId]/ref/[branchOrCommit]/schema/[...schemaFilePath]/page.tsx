import type { PageProps } from '@/app/types'
import { SchemaPage } from '@/features/schemas/pages/SchemaPage'
import { branchOrCommitSchema } from '@/utils/routes'

import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
  schemaFilePath: v.array(v.string()),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const { projectId, branchOrCommit, schemaFilePath } = parsedParams.output
  const filePath = schemaFilePath.join('/')

  return (
    <SchemaPage
      projectId={projectId}
      branchOrCommit={branchOrCommit}
      schemaFilePath={filePath}
    />
  )
}
