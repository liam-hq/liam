import type { PageProps } from '@/app/types'
import { SchemaPage } from '@/features/schemas/pages/SchemaPage'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: v.string(),
  commit: v.string(),
  schemaFilePath: v.array(v.string()),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    throw new Error('Invalid parameters')
  }

  const { projectId, commit, schemaFilePath } = parsedParams.output
  const filePath = schemaFilePath.join('/')

  return (
    <SchemaPage
      projectId={projectId}
      branchOrCommit={commit}
      schemaFilePath={filePath}
    />
  )
}
