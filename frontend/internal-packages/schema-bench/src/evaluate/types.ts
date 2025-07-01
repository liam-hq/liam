export type Mapping = Record<string, string>

export type EvaluateResult = {
  tableMapping: Mapping
  columnMappings: Record<string, Mapping>
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

export type ColumnEvaluationResult = {
  totalColumnF1Score: number
  totalColumnAllCorrectCount: number
  totalPrimaryKeyCorrectCount: number
  totalConstraintCorrectCount: number
  allColumnMappings: Record<string, Mapping>
}

export type AverageCalculationParams = {
  totalColumnF1Score: number
  totalColumnAllCorrectCount: number
  totalPrimaryKeyCorrectCount: number
  totalConstraintCorrectCount: number
  totalTableCount: number
}

// Small epsilon value for numerical comparisons
export const EPSILON = 1e-5

// Threshold for determining if all components are correct (table + column + primary key)
// The value 2.9 represents the sum of perfect scores across three dimensions:
// - Table name matching (1.0)
// - Column name matching (1.0)
// - Primary key validation (0.9)
// This threshold ensures that all components must achieve near-perfect accuracy to be considered "all correct."
export const ALL_CORRECT_THRESHOLD = 2.9
