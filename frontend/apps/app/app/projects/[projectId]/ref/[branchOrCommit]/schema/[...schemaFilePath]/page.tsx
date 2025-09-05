import { notFound } from 'next/navigation'
import * as v from 'valibot'
import { SchemaPage } from '../../../../../../../../../../components/SchemaPage'
import { branchOrCommitSchema } from '../../../../../../../../../../libs/routes'
import type { PageProps } from '../../../../../../../../../types'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
  schemaFilePath: v.array(v.string()),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) notFound()

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
