export type SchemaFile = {
  filename: string
  content: string
}

export type SchemaChange = {
  filename: string
  status:
    | 'added'
    | 'modified'
    | 'deleted'
    | 'removed'
    | 'renamed'
    | 'copied'
    | 'changed'
    | 'unchanged'
  changes: number
  patch: string
}

export type SavePullRequestPayload = {
  prNumber: number
  pullRequestTitle: string
  owner: string
  name: string
  repositoryId: number
}

export type SavePullRequestResult = {
  success: boolean
  prId: number
  schemaFiles: Array<SchemaFile>
  schemaChanges: Array<SchemaChange>
}

export type GenerateReviewPayload = {
  pullRequestId: number
  projectId: number
  repositoryId: number
  schemaFiles: Array<SchemaFile>
  schemaChanges: Array<SchemaChange>
}

export type ReviewResponse = {
  reviewComment: string
  projectId: number
  pullRequestId: number
  repositoryId: number
}
