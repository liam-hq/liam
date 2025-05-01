import { getRepositoryCommits } from '@liam-hq/github'
import { createClient } from '@/libs/db/server'

export type Commit = {
  sha: string
  shortSha: string // 先頭8文字
  date: string
  message: string
  author: string
}

export async function getCommits(
  projectId: string,
  branch: string,
  currentCommit?: string
): Promise<Commit[]> {
  const supabase = await createClient()
  
  // プロジェクトとリポジトリ情報の取得
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_repository_mappings!inner (
        github_repositories (
          id,
          name,
          owner,
          github_installation_identifier
        )
      )
    `)
    .eq('id', projectId)
    .single()

  if (error || !project) {
    console.error('Error fetching project:', error)
    throw new Error('Project not found')
  }

  const repository = project.project_repository_mappings[0].github_repositories
  
  // コミット一覧の取得
  const commits = await getRepositoryCommits(
    Number(repository.github_installation_identifier),
    repository.owner,
    repository.name,
    branch,
    100 // 最大100件まで取得
  )
  
  if (!commits || commits.length === 0) {
    return []
  }
  
  // コミット情報を整形して返す
  return commits.map(commit => ({
    sha: commit.sha,
    shortSha: commit.sha.substring(0, 8),
    date: commit.date,
    message: commit.message,
    author: commit.author
  }))
}
