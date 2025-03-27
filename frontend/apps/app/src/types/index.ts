export type GenerateReviewPayload = {
  pullRequestId: number
  projectId: number
  repositoryId: number
  owner: string
  name: string
  pullRequestNumber: number
  schemaFiles: Array<{
    filename: string
    content: string
  }>
  schemaChanges: Array<{
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
  }>
}

export type ReviewResponse = {
  reviewComment: string
  projectId: number
  pullRequestId: number
  repositoryId: number
}

export type SchemaChangeInfo = {
  filename: string
  content: string
  owner: string
  name: string
  pullRequestNumber: number
}
