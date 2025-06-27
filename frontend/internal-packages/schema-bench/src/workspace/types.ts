import type { Schema } from '@liam-hq/db-structure'

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
