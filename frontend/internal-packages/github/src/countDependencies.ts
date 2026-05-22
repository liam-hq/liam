import { getFileContent } from './api.server'

export async function countDependencies(
  repositoryFullName: string,
  ref: string,
  installationId: number,
): Promise<{ count: number } | { error: string }> {
  const { content } = await getFileContent(
    repositoryFullName,
    'package.json',
    ref,
    installationId,
  )

  if (content === null) {
    return {
      error: `Failed to fetch package.json from ${repositoryFullName}@${ref}`,
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { error: `Failed to parse package.json: ${message}` }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { error: 'package.json is not a valid object' }
  }

  if (!('dependencies' in parsed)) {
    return { count: 0 }
  }

  const dependencies = parsed.dependencies

  if (typeof dependencies !== 'object' || dependencies === null) {
    return { error: 'dependencies field is not a valid object' }
  }

  return { count: Object.keys(dependencies).length }
}
