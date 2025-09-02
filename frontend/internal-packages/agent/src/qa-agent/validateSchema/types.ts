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
      error: string
      failedSql: string
    }
)
