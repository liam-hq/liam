import { getProjectRepository } from '@/features/projects/services/getProjectRepository'
import { getFileContent } from '@liam-hq/github'

export async function getOriginalDocumentContent(
  projectId: string,
  branchOrCommit: string,
  docPath: string,
): Promise<string | null> {
  try {
    const projectRepo = await getProjectRepository(projectId)
    if (!projectRepo) {
      console.error('Repository information not found')
      return null
    }

    const { repository } = projectRepo
    const repositoryFullName = `${repository.owner}/${repository.name}`

    const fileData = await getFileContent(
      repositoryFullName,
      docPath,
      branchOrCommit,
      repository.github_installation_identifier,
    )

    return fileData.content
  } catch (error) {
    console.error('Error fetching original document content:', error)
    return null
  }
}
