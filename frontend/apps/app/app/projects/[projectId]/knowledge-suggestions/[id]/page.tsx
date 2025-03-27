import type { PageProps } from '@/app/types'
import { KnowledgeSuggestionDetailPage } from '@/features/projects/pages/KnowledgeSuggestionDetailPage'
import { notFound } from 'next/navigation'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  id: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return notFound()

  return (
    <KnowledgeSuggestionDetailPage
      projectId={parsedParams.output.projectId}
      suggestionId={parsedParams.output.id}
    />
  )
}
