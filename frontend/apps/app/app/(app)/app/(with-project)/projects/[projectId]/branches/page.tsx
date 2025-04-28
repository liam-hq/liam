import type { PageProps } from '@/app/types'
import { ProjectBranchesListPage } from '@/features/projects/pages/ProjectBranchesListPage/ProjectBranchesListPage'

import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function BranchesPage({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return null
  return <ProjectBranchesListPage projectId={parsedParams.output.projectId} />
}
