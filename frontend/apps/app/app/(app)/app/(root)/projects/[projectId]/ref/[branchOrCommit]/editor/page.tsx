import type { PageProps } from '@/app/types'
import { EditorPage } from '@/components/EditorPage'
import { branchOrCommitSchema } from '@/utils/routes'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    throw new Error('Invalid parameters')
  }

  const { projectId, branchOrCommit } = parsedParams.output

  return <EditorPage projectId={projectId} branchOrCommit={branchOrCommit} />
}
