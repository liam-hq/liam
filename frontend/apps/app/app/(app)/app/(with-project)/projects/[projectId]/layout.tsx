import type { LayoutProps } from '@/app/types'
import { CommonLayout } from '@/components/CommonLayout'
import { ProjectLayout } from '@/components/ProjectLayout'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function Layout({ children, params }: LayoutProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    // TODO: Reconsider the display when parse fails
    return children
  }

  const { projectId } = parsedParams.output

  return (
    <CommonLayout projectId={projectId}>
      <ProjectLayout projectId={projectId}>{children}</ProjectLayout>
    </CommonLayout>
  )
}
