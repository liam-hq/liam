export type GenerateReviewPayload = {
  pullRequestNumber: number
  projectId: number | undefined
  repositoryId: number
  schemaChanges: Array<{
    filename: string
    status: 'added' | 'modified' | 'deleted'
    changes: number
    patch: string
  }>
}

export type ReviewResponse = {
  reviewComment: string
  projectId: number | undefined
  pullRequestId: number
  repositoryId: number
}
