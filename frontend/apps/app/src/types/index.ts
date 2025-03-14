export type GenerateReviewPayload = {
  pullRequestId: number
  projectId: number | undefined
  repositoryId: number
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
  repositoryDbId: number
}

export type ReviewResponse = {
  reviewComment: string
  projectId: number | undefined
  pullRequestId: number
  repositoryId: number
  repositoryDbId: number
}
