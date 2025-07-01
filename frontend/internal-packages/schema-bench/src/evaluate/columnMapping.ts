import type { Schema } from '@liam-hq/db-structure'
import { nameSimilarity } from '../nameSimilarity/nameSimilarity.ts'
import { wordOverlapMatch } from '../wordOverlapMatch/wordOverlapMatch.ts'
import {
  validateConstraints,
  validatePrimaryKeys,
} from './constraintValidation.ts'
import type { ColumnEvaluationResult, Mapping } from './types.ts'
import { EPSILON } from './types.ts'

export const createColumnMapping = async (
  referenceColumnNames: string[],
  predictColumnNames: string[],
): Promise<Mapping> => {
  const columnMapping: Mapping = {}

  // NOTE: Implement synonym matching if needed
  // --- (0) synonym matching

  // --- (1) name similarity matching
  await nameSimilarity(referenceColumnNames, predictColumnNames, columnMapping)

  // --- (2) word overlap matching
  wordOverlapMatch(referenceColumnNames, predictColumnNames, columnMapping)

  return columnMapping
}

export const calculateColumnMetrics = (
  referenceColumnNames: string[],
  predictColumnNames: string[],
  columnMapping: Mapping,
) => {
  const columnPrecision =
    predictColumnNames.length === 0
      ? 0
      : Object.keys(columnMapping).length / predictColumnNames.length
  const columnRecall =
    referenceColumnNames.length === 0
      ? 0
      : Object.keys(columnMapping).length / referenceColumnNames.length
  const columnF1 =
    columnPrecision + columnRecall === 0
      ? 0
      : (2 * columnPrecision * columnRecall) / (columnPrecision + columnRecall)

  return {
    columnF1,
    columnAllcorrect: Math.abs(columnF1 - 1) < EPSILON ? 1 : 0,
  }
}

const evaluateTablePair = async (
  referenceTable: Schema['tables'][string],
  predictTable: Schema['tables'][string],
) => {
  const referenceColumnNames = Object.keys(referenceTable.columns)
  const predictColumnNames = Object.keys(predictTable.columns)

  const columnMapping = await createColumnMapping(
    referenceColumnNames,
    predictColumnNames,
  )

  const { columnF1, columnAllcorrect } = calculateColumnMetrics(
    referenceColumnNames,
    predictColumnNames,
    columnMapping,
  )

  const isPrimaryKeyCorrect = validatePrimaryKeys(
    referenceTable,
    predictTable,
    columnMapping,
  )

  const isConstraintCorrect = validateConstraints(referenceTable, predictTable)

  return {
    columnMapping,
    columnF1,
    columnAllcorrect,
    isPrimaryKeyCorrect,
    isConstraintCorrect,
  }
}

const processTableInMapping = async (
  tableName: string,
  reference: Schema,
  predict: Schema,
  tableMapping: Mapping,
) => {
  const referenceTable = reference.tables[tableName]
  const predictTableName = tableMapping[tableName]
  if (!predictTableName || !referenceTable) return null
  const predictTable = predict.tables[predictTableName]
  if (!predictTable) return null

  return await evaluateTablePair(referenceTable, predictTable)
}

export const evaluateColumns = async (
  reference: Schema,
  predict: Schema,
  tableMapping: Mapping,
): Promise<ColumnEvaluationResult> => {
  let totalColumnF1Score = 0
  let totalColumnAllCorrectCount = 0
  let totalPrimaryKeyCorrectCount = 0
  let totalConstraintCorrectCount = 0
  const allColumnMappings: Record<string, Mapping> = {}

  for (const tableName of Object.keys(tableMapping)) {
    const result = await processTableInMapping(
      tableName,
      reference,
      predict,
      tableMapping,
    )
    if (!result) continue

    allColumnMappings[tableName] = result.columnMapping
    totalColumnF1Score += result.columnF1
    totalColumnAllCorrectCount += result.columnAllcorrect
    totalPrimaryKeyCorrectCount += result.isPrimaryKeyCorrect ? 1 : 0
    totalConstraintCorrectCount += result.isConstraintCorrect ? 1 : 0
  }

  return {
    totalColumnF1Score,
    totalColumnAllCorrectCount,
    totalPrimaryKeyCorrectCount,
    totalConstraintCorrectCount,
    allColumnMappings,
  }
}
