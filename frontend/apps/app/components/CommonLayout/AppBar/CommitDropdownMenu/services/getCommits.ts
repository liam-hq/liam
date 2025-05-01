export type Commit = {
  sha: string
  shortSha: string // First 8 characters
  date: string
  message: string
  author: string
}

export async function getCommits(
  projectId: string,
  branch: string,
  _currentCommit?: string,
): Promise<Commit[]> {
  try {
    // Fetch commit list from API endpoint
    const response = await fetch(
      `/api/projects/${projectId}/branches/${branch}/commits`,
    )

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data.commits || []
  } catch (error) {
    console.error('Error fetching commits:', error)
    return [] // Return empty array in case of error
  }
}
