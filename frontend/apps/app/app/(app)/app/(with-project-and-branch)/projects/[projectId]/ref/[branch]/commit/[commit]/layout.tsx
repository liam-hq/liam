import type { LayoutProps } from '@/app/types'
import {} from '@/components'
import { CommonLayout } from '@/components/CommonLayout'
import { ProjectLayout } from '@/components/ProjectLayout'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branch: v.string(),
  commit: v.string(),
})

export default async function Layout({ params, children }: LayoutProps) {
  const parsedParams = v.safeParse(paramsSchema, params)
  if (!parsedParams.success) {
    // TODO: Reconsider the display when parse fails
    return children
  }

  const { projectId, branch, commit } = parsedParams.output

  return (
    <CommonLayout 
      projectId={projectId} 
      branchOrCommit={commit}
      branch={branch}
      commit={commit}
    >
      <ProjectLayout projectId={projectId} branchOrCommit={commit}>
        {children}
      </ProjectLayout>
    </CommonLayout>
  )
}
