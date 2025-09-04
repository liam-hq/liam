import { notFound } from 'next/navigation'
import * as v from 'valibot'
import { ProjectSessionsPage } from '../../../../../../../../../components/ProjectSessionsPage'
import { branchOrCommitSchema } from '../../../../../../../../../libs/routes'
import type { PageProps } from '../../../../../../../../types'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) notFound()

  const { projectId } = parsedParams.output
  return <ProjectSessionsPage projectId={projectId} />
}
