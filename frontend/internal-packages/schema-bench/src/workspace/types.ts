import type { Schema } from '@liam-hq/db-structure'

export interface FileSystemAdapter {
  existsSync: (path: string) => boolean
  mkdirSync: (path: string, options?: { recursive?: boolean }) => void
  rmSync: (path: string, options?: { recursive?: boolean; force?: boolean }) => void
  readdirSync: (path: string) => string[]
  copyFileSync: (src: string, dest: string) => void
  readFileSync: (path: string, encoding: 'utf-8') => string
  writeFileSync: (path: string, data: string) => void
}

export interface WorkspaceConfig {
  workspacePath: string
  defaultDataPath: string
  overwrite: boolean
}

export interface BenchmarkConfig {
  workspacePath: string
  caseId?: string
  outputFormat: 'json' | 'summary'
}

export interface BenchmarkResult {
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
