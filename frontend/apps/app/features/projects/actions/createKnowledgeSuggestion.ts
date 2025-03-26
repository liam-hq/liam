'use server'

import { getFileContentWithSha } from '@/libs/github/api.server'
import { prisma } from '@liam-hq/db'
import { redirect } from 'next/navigation'

export const createKnowledgeSuggestion = async (formData: FormData) => {
  const projectId = formData.get('projectId') as string
  const type = formData.get('type') as 'SCHEMA' | 'DOCS'
  const title = formData.get('title') as string
  const path = formData.get('path') as string
  const content = formData.get('content') as string
  const repositoryOwner = formData.get('repositoryOwner') as string
  const repositoryName = formData.get('repositoryName') as string
  const installationId = formData.get('installationId') as string

  try {
    const repositoryFullName = `${repositoryOwner}/${repositoryName}`

    // Fetch the current file content and SHA from GitHub
    const { sha } = await getFileContentWithSha(
      repositoryFullName,
      path,
      'main', // Use main branch
      Number(installationId),
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
        projectId: Number(projectId),
      },
    })

    // Redirect to the knowledge suggestion detail page
    redirect(
      `/app/projects/${projectId}/knowledge-suggestions/${knowledgeSuggestion.id}`,
    )
  } catch (error) {
    console.error('Error creating knowledge suggestion:', error)
    throw error
  }
}
