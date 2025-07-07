import type { Schema } from '@liam-hq/db-structure'
import type { Result } from 'neverthrow'

export interface WorkspaceConfig {
  workspacePath: string
  defaultDataPath: string
}

export interface EvaluationConfig {
  workspacePath: string
  caseId?: string
  outputFormat: 'json' | 'summary'
}

export interface EvaluationResult {
  timestamp: string
  caseId: string
  metrics: {
    tableF1Score: number
    tableAllCorrectRate: number
    columnF1ScoreAverage: number
    columnAllCorrectRateAverage: number
    primaryKeyAccuracyAverage: number
    constraintAccuracy: number
    foreignKeyF1Score: number
    foreignKeyAllCorrectRate: number
    overallSchemaAccuracy: number
  }
  tableMapping: Record<string, string>
  columnMappings: Record<string, Record<string, string>>
}

export interface CaseData {
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
