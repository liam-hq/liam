export type FailedOperation = {
  sql: string
  error: string
}

export type TestcaseDmlExecutionResult = {
  testCaseId: string
  testCaseTitle: string
  success: boolean
  failedOperation?: FailedOperation | undefined
  executedAt: Date
}
