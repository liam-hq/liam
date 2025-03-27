import { getFileContentWithSha } from '@/libs/github/api.server'
import { prisma } from '@liam-hq/db'
import type { KnowledgeType } from '@prisma/client'

type CreateKnowledgeSuggestionPayload = {
  projectId: number
  type: KnowledgeType
  title: string
  path: string
  content: string
  repositoryOwner: string
  repositoryName: string
  installationId: number
}

export const processCreateKnowledgeSuggestion = async (
  payload: CreateKnowledgeSuggestionPayload,
) => {
  const {
    projectId,
    type,
    title,
    path,
    content,
    repositoryOwner,
    repositoryName,
    installationId,
  } = payload

  const repositoryFullName = `${repositoryOwner}/${repositoryName}`

  // Fetch the current file content and SHA from GitHub
  const { sha } = await getFileContentWithSha(
    repositoryFullName,
    path,
    'tmp-knowledge-suggestion', // Use tmp-knowledge-suggestion branch
    installationId,
  )

  if (!sha) {
    throw new Error('Failed to get file SHA from GitHub')
  }

  // Create the knowledge suggestion
  const knowledgeSuggestion = await prisma.knowledgeSuggestion.create({
    data: {
      type,
      title,
      path,
      content,
      fileSha: sha,
      projectId,
    },
  })

  return {
    suggestionId: knowledgeSuggestion.id,
    success: true,
  }
}
