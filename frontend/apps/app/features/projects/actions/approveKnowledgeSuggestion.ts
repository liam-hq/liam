'use server'

import { urlgen } from '@/utils/routes'
import { prisma } from '@liam-hq/db'
import { updateFileContent } from '@liam-hq/github'
import { redirect } from 'next/navigation'
import * as v from 'valibot'

// Define schema for form data validation with transforms
const formDataSchema = v.object({
  suggestionId: v.pipe(
    v.string(),
    v.transform((value) => Number(value)),
  ),
  repositoryOwner: v.string(),
  repositoryName: v.string(),
  installationId: v.pipe(
    v.string(),
    v.transform((value) => Number(value)),
  ),
})

export const approveKnowledgeSuggestion = async (formData: FormData) => {
  // Parse and validate form data
  const formDataObject = {
    suggestionId: formData.get('suggestionId'),
    repositoryOwner: formData.get('repositoryOwner'),
    repositoryName: formData.get('repositoryName'),
    installationId: formData.get('installationId'),
  }

  const parsedData = v.safeParse(formDataSchema, formDataObject)

  if (!parsedData.success) {
    throw new Error(`Invalid form data: ${JSON.stringify(parsedData.issues)}`)
  }

  const { suggestionId, repositoryOwner, repositoryName, installationId } =
    parsedData.output

  try {
    // Get the knowledge suggestion
    const suggestion = await prisma.knowledgeSuggestion.findUnique({
      where: {
        id: suggestionId,
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
      installationId,
      suggestion.branchName,
    )

    if (!success) {
      throw new Error('Failed to update file on GitHub')
    }

    // Update the knowledge suggestion with approvedAt
    await prisma.knowledgeSuggestion.update({
      where: {
        id: suggestionId,
      },
      data: {
        approvedAt: new Date(),
      },
    })

    // Redirect back to the knowledge suggestion detail page
    redirect(
      urlgen('projects/[projectId]/knowledge-suggestions/[id]', {
        projectId: `${suggestion.projectId}`,
        id: `${suggestionId}`,
      }),
    )
  } catch (error) {
    console.error('Error approving knowledge suggestion:', error)
    throw error
  }
}
