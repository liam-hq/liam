import type { PageProps } from '@/app/types'
import { ProjectBranchesListPage } from '@/components/ProjectBranchesListPage'

import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function BranchesPage({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')
  return <ProjectBranchesListPage projectId={parsedParams.output.projectId} />
}
