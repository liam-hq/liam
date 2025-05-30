import type { LayoutProps } from '@/app/types'
import { CommonLayout } from '@/components/CommonLayout'
import { ProjectLayout } from '@/components/ProjectLayout'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function Layout({ params, children }: LayoutProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    // TODO: Reconsider the display when parse fails
    return children
  }

  const { projectId } = parsedParams.output
  const branchOrCommit = 'main' // TODO
  return (
    <CommonLayout projectId={projectId} branchOrCommit={branchOrCommit}>
      <ProjectLayout
        projectId={projectId}
        branchOrCommit={branchOrCommit}
        projectHeader={false}
      >
        {children}
      </ProjectLayout>
    </CommonLayout>
  )
}
