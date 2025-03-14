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
  repositoryDbId: number
  pullRequestDbId: number
}

export type ReviewResponse = {
  reviewComment: string
  projectId: number | undefined
  repositoryDbId: number
  pullRequestDbId: number
  pullRequestNumber: number
}
