import type { PageProps } from '@/app/types'
import { ProjectSessionsPage } from '@/components/ProjectSessionsPage'
import { branchOrCommitSchema } from '@/libs/routes'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const { projectId } = parsedParams.output
  return <ProjectSessionsPage projectId={projectId} />
}
