import type { PageProps } from '@/app/types'
import { DocsListPage } from '@/features/projects/pages/DocsListPage'
import { notFound } from 'next/navigation'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return notFound()

  return <DocsListPage projectId={parsedParams.output.projectId} />
}
