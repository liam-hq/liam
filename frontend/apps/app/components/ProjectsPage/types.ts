import type { Tables } from '@liam-hq/db'

/**
 * Extended project type with last commit date
 */
export type ProjectWithLastCommit = Tables<'projects'> & {
  lastCommitDate?: string
  project_repository_mappings?: Array<{
    repository: Tables<'github_repositories'>
  }>
}
