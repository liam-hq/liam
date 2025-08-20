import type { Tables } from '@liam-hq/db'

/**
 * Extended project type with last commit date
 */
export type ProjectWithLastCommit = Tables<'projects'> & {
  // eslint-disable-next-line no-restricted-syntax
  lastCommitDate?: string
  // eslint-disable-next-line no-restricted-syntax
  project_repository_mappings?: Array<{
    repository: Tables<'github_repositories'>
  }>
}
