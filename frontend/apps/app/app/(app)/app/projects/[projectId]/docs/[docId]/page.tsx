import type { PageProps } from '@/app/types'
import { DocDetailPage } from '@/features/projects/pages/DocDetailPage'
import { notFound } from 'next/navigation'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  docId: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return notFound()

  return (
    <DocDetailPage
      projectId={parsedParams.output.projectId}
      docId={parsedParams.output.docId}
    />
  )
}
