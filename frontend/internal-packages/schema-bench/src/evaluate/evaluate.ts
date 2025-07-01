/**
 * Database Schema Evaluation Script
 *
 * This script evaluates the accuracy of predicted database schemas against reference schemas.
 * It performs comprehensive matching and scoring across multiple dimensions:
 * - Table name mapping using word overlap and semantic similarity
 * - Column name matching within each table
 * - Primary key validation
 * - Constraint validation
 *
 * The evaluation produces metrics including F1 scores, precision/recall, and all-correct rates
 * to assess the quality of schema prediction models or tools.
 */
import type { Schema } from '@liam-hq/db-structure'
import { calculateAverages } from './calculateAverages.ts'
import { calculateTableMetrics } from './calculateTableMetrics.ts'
import { createTableMapping } from './createTableMapping.ts'
import { evaluateColumns } from './evaluateColumns.ts'
import { evaluateForeignKeys } from './evaluateForeignKeys.ts'
import type {
  ColumnEvaluationResult,
  EvaluateResult,
  Mapping,
} from './types.ts'
import { ALL_CORRECT_THRESHOLD } from './types.ts'

type EvaluationData = {
  tableMapping: Mapping
  tableMetrics: ReturnType<typeof calculateTableMetrics>
  columnData: ColumnEvaluationResult
  foreignKeyData: ReturnType<typeof evaluateForeignKeys>
  averages: ReturnType<typeof calculateAverages>
}

const buildEvaluationResult = (data: EvaluationData): EvaluateResult => {
  const overallSchemaAccuracy =
    data.averages.primaryKeyAccuracyAverage +
      data.averages.columnAllCorrectRateAverage +
      data.tableMetrics.tableAllcorrect >
    ALL_CORRECT_THRESHOLD
      ? 1
      : 0

  return {
    tableMapping: data.tableMapping,
    columnMappings: data.columnData.allColumnMappings,
    tableF1Score: data.tableMetrics.tableF1,
    tableAllCorrectRate: data.tableMetrics.tableAllcorrect,
    columnF1ScoreAverage: data.averages.columnF1ScoreAverage,
    columnAllCorrectRateAverage: data.averages.columnAllCorrectRateAverage,
    primaryKeyAccuracyAverage: data.averages.primaryKeyAccuracyAverage,
    constraintAccuracy: data.averages.constraintAccuracy,
    foreignKeyF1Score: data.foreignKeyData.foreignKeyF1,
    foreignKeyAllCorrectRate: data.foreignKeyData.foreignKeyAllCorrect,
    overallSchemaAccuracy,
  }
}

export const evaluate = async (
  reference: Schema,
  predict: Schema,
): Promise<EvaluateResult> => {
  const referenceTableNames = Object.keys(reference.tables)
  const predictTableNames = Object.keys(predict.tables)

  const tableMapping = await createTableMapping(
    referenceTableNames,
    predictTableNames,
  )
  const tableMetrics = calculateTableMetrics(
    referenceTableNames,
    predictTableNames,
    tableMapping,
  )
  const columnData = await evaluateColumns(reference, predict, tableMapping)
  const foreignKeyData = evaluateForeignKeys(reference.tables, predict.tables)

  const averages = calculateAverages({
    totalColumnF1Score: columnData.totalColumnF1Score,
    totalColumnAllCorrectCount: columnData.totalColumnAllCorrectCount,
    totalPrimaryKeyCorrectCount: columnData.totalPrimaryKeyCorrectCount,
    totalConstraintCorrectCount: columnData.totalConstraintCorrectCount,
    totalTableCount: referenceTableNames.length,
  })

  return buildEvaluationResult({
    tableMapping,
    tableMetrics,
    columnData,
    foreignKeyData,
    averages,
  })
}
