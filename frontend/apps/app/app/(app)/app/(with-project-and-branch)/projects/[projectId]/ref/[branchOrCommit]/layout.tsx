import type { LayoutProps } from '@/app/types'
import {} from '@/components'
import { CommonLayout } from '@/components/CommonLayout'
import { ProjectLayout } from '@/components/ProjectLayout'
import { branchOrCommitSchema } from '@/utils/routes'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
})

export default async function Layout({ params, children }: LayoutProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    // TODO: Reconsider the display when parse fails
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
