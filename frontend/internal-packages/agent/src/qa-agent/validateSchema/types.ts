export type FailedOperation = {
  sql: string
  error: string
}

export type TestcaseDmlExecutionResult = {
  testCaseId: string
  testCaseTitle: string
  success: boolean
  executedOperations: number
  failedOperations?: FailedOperation[]
  executedAt: Date
}
