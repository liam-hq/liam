import * as v from 'valibot'
import type { LayoutProps } from '@/app/types'
import {} from '@/components'
import { CommonLayout } from '@/components/CommonLayout'
import { ProjectLayout } from '@/components/ProjectLayout'
import { branchOrCommitSchema } from '@/libs/routes'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
})

export default async function Layout({ params, children }: LayoutProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    return children
  }

  const { projectId, branchOrCommit } = parsedParams.output

  return (
    <CommonLayout projectId={projectId} branchOrCommit={branchOrCommit}>
      <ProjectLayout projectId={projectId} branchOrCommit={branchOrCommit}>
        {children}
      </ProjectLayout>
    </CommonLayout>
  )
}
