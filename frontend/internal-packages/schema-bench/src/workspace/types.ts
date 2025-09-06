import type { Schema } from '@liam-hq/schema'
import type { Result } from 'neverthrow'

export type WorkspaceConfig = {
  workspacePath: string
  defaultDataPath: string
}

export type EvaluationConfig = {
  workspacePath: string
  caseId?: string
  outputFormat: 'json' | 'summary'
}

export type EvaluationResult = {
  timestamp: string
  caseId: string
  metrics: {
    tableF1Score: number
    tableRecall: number
    tableAllCorrectRate: number
    columnF1ScoreAverage: number
    columnRecallAverage: number
    columnAllCorrectRateAverage: number
    primaryKeyAccuracyAverage: number
    constraintAccuracy: number
    foreignKeyF1Score: number
    foreignKeyRecall: number
    foreignKeyAllCorrectRate: number
    overallSchemaAccuracy: number
  }
  tableMapping: Record<string, string>
  columnMappings: Record<string, Record<string, string>>
}

export type CaseData = {
  caseId: string
  outputSchema: Schema
  referenceSchema: Schema
}

// Error types for better type safety
export type WorkspaceError =
  | { type: 'DIRECTORY_NOT_FOUND'; path: string }
  | { type: 'FILE_READ_ERROR'; path: string; cause: string }
  | { type: 'FILE_WRITE_ERROR'; path: string; cause: string }
  | { type: 'JSON_PARSE_ERROR'; path: string; cause: string }
  | {
      type: 'SCHEMA_NOT_FOUND'
      caseId: string
      schemaType: 'output' | 'reference'
    }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'EVALUATION_ERROR'; caseId: string; cause: string }

// Result types using neverthrow
export type WorkspaceResult<T> = Result<T, WorkspaceError>
export type SetupResult = WorkspaceResult<void>
