import type { PageProps } from '@/app/types'
import { ProjectDetailPage } from '@/features/projects/pages'
import { notFound } from 'next/navigation'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return notFound()

  return <ProjectDetailPage projectId={parsedParams.output.projectId} />
}
