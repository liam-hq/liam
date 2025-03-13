export type GitHubWebhookPayload = {
  action: string
  pull_request?: PullRequest
  repository: Repository
  sender: User
  installation: {
    id: number
  }
  repositories?: Repository[]
}

export type PullRequest = {
  id: number
  number: number
  title: string
  user: User
  body: string | null
  state: string
  html_url: string
  diff_url: string
  created_at: string
  updated_at: string
  head: {
    ref: string
    sha: string
    repo: Repository
  }
  base: {
    ref: string
    sha: string
    repo: Repository
  }
  additions: number
  deletions: number
  changed_files: number
}

export type Repository = {
  id: number
  name: string
  full_name: string
  owner: User
  html_url: string
  description: string | null
  private: boolean
}

export type User = {
  id: number
  login: string
  avatar_url: string
  html_url: string
}

export type FileChange = {
  filename: string
  status:
    | 'added'
    | 'removed'
    | 'modified'
    | 'renamed'
    | 'copied'
    | 'changed'
    | 'unchanged'
  additions: number
  deletions: number
  changes: number
  fileType: string
  patch?: string | undefined
}
