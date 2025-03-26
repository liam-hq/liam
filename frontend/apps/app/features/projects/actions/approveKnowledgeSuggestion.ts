'use server'

import { updateFileContent } from '@/libs/github/api.server'
import { prisma } from '@liam-hq/db'
import { redirect } from 'next/navigation'

export const approveKnowledgeSuggestion = async (formData: FormData) => {
  const suggestionId = formData.get('suggestionId') as string
  const repositoryOwner = formData.get('repositoryOwner') as string
  const repositoryName = formData.get('repositoryName') as string
  const installationId = formData.get('installationId') as string

  try {
    // Get the knowledge suggestion
    const suggestion = await prisma.knowledgeSuggestion.findUnique({
      where: {
        id: Number(suggestionId),
      },
    })

    if (!suggestion) {
      throw new Error('Knowledge suggestion not found')
    }

    // Update the file on GitHub
    const repositoryFullName = `${repositoryOwner}/${repositoryName}`
    const success = await updateFileContent(
      repositoryFullName,
      suggestion.path,
      suggestion.content,
      suggestion.fileSha,
      suggestion.title, // Use title as commit message
      Number(installationId),
      'main', // Use main branch
    )

    if (!success) {
      throw new Error('Failed to update file on GitHub')
    }

    // Update the knowledge suggestion with approvedAt
    await prisma.knowledgeSuggestion.update({
      where: {
        id: Number(suggestionId),
      },
      data: {
        approvedAt: new Date(),
      },
    })

    // Redirect back to the knowledge suggestion detail page
    redirect(
      `/app/projects/${suggestion.projectId}/knowledge-suggestions/${suggestionId}`,
    )
  } catch (error) {
    console.error('Error approving knowledge suggestion:', error)
    throw error
  }
}
