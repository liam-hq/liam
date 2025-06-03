import type { components } from '@octokit/openapi-types'

export type Installation = components['schemas']['installation']
export type Repository = components['schemas']['repository']

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
  patch: string
}

export type GitHubWebhookPayload = {
  action?: string
  installation: {
    id: number
  }
  repository: {
    name: string
    owner: {
      login: string
    }
  }
  pull_request?: {
    number: number
    title: string
    head: {
      ref: string
    }
  }
}
