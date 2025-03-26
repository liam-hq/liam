import type { PageProps } from '@/app/types'
import { KnowledgeSuggestionsListPage } from '@/features/projects/pages/KnowledgeSuggestionsListPage'
import { notFound } from 'next/navigation'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function KnowledgeSuggestionsPage({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return notFound()

  return (
    <KnowledgeSuggestionsListPage projectId={parsedParams.output.projectId} />
  )
}
