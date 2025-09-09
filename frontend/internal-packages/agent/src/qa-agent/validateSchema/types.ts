export type FailedOperation = {
  sql: string
  error: string
}

export type TestcaseDmlExecutionResult = {
  testCaseId: string
  testCaseTitle: string
  executedAt: Date
} & (
  | {
      success: true
    }
  | {
      success: false
      failedOperation: FailedOperation
    }
)
