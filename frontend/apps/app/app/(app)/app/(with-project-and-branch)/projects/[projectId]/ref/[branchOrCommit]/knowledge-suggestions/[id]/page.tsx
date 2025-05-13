import type { PageProps } from '@/app/types'
import { KnowledgeSuggestionDetailPage } from '@/components/KnowledgeSuggestionDetailPage'
import { branchOrCommitSchema } from '@/libs/routes'

import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: branchOrCommitSchema,
  id: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  return (
    <KnowledgeSuggestionDetailPage
      projectId={parsedParams.output.projectId}
      branchOrCommit={parsedParams.output.branchOrCommit}
      suggestionId={parsedParams.output.id}
    />
  )
}
