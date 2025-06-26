import * as v from 'valibot'
import type { LayoutProps } from '@/app/types'
import { CommonLayout } from '@/components/CommonLayout'
import { ProjectLayout } from '@/components/ProjectLayout'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function Layout({ children, params }: LayoutProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    return children
  }

  const { projectId } = parsedParams.output

  return (
    <CommonLayout projectId={projectId}>
      <ProjectLayout projectId={projectId}>{children}</ProjectLayout>
    </CommonLayout>
  )
}
