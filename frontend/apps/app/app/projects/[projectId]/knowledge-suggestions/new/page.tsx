import type { PageProps } from '@/app/types'
import { KnowledgeSuggestionNewPage } from '@/features/projects/pages/KnowledgeSuggestionNewPage'
import { notFound } from 'next/navigation'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function KnowledgeSuggestionNewPageWrapper({
  params,
}: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return notFound()

  return (
    <KnowledgeSuggestionNewPage projectId={parsedParams.output.projectId} />
  )
}
