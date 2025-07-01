import type { ForeignKeyConstraint, Schema } from '@liam-hq/db-structure'
import { foreignKeyConstraintSchema } from '@liam-hq/db-structure'
import * as v from 'valibot'
import type { Mapping } from './types.ts'
import { EPSILON } from './types.ts'

type ForeignKeyInfo = {
  name: string
  constraint: ForeignKeyConstraint
  tableName: string
}

const extractForeignKeys = (tables: Schema['tables']): ForeignKeyInfo[] => {
  const foreignKeys: ForeignKeyInfo[] = []

  for (const [tableName, table] of Object.entries(tables)) {
    for (const [constraintName, constraint] of Object.entries(
      table.constraints,
    )) {
      const result = v.safeParse(foreignKeyConstraintSchema, constraint)
      if (result.success && result.output) {
        foreignKeys.push({
          name: constraintName,
          constraint: result.output,
          tableName,
        })
      }
    }
  }

  return foreignKeys
}

const areForeignKeysMatching = (
  refFk: ForeignKeyInfo,
  predFk: ForeignKeyInfo,
): boolean => {
  return (
    refFk.tableName === predFk.tableName &&
    refFk.constraint.columnName === predFk.constraint.columnName &&
    refFk.constraint.targetTableName === predFk.constraint.targetTableName &&
    refFk.constraint.targetColumnName === predFk.constraint.targetColumnName
  )
}

const createForeignKeyMapping = (
  referenceTables: Schema['tables'],
  predictTables: Schema['tables'],
): Mapping => {
  const foreignKeyMapping: Mapping = {}

  const referenceForeignKeys = extractForeignKeys(referenceTables)
  const predictForeignKeys = extractForeignKeys(predictTables)

  // Match foreign keys based on table names and column references
  for (const refFk of referenceForeignKeys) {
    for (const predFk of predictForeignKeys) {
      if (areForeignKeysMatching(refFk, predFk)) {
        foreignKeyMapping[refFk.name] = predFk.name
        break
      }
    }
  }

  return foreignKeyMapping
}

const calculateForeignKeyMetrics = (
  referenceTables: Schema['tables'],
  predictTables: Schema['tables'],
  foreignKeyMapping: Mapping,
) => {
  // Count foreign key constraints
  const referenceCount = Object.values(referenceTables)
    .flatMap((table) => Object.values(table.constraints))
    .filter((constraint) => constraint.type === 'FOREIGN KEY').length

  const predictCount = Object.values(predictTables)
    .flatMap((table) => Object.values(table.constraints))
    .filter((constraint) => constraint.type === 'FOREIGN KEY').length

  const matchedCount = Object.keys(foreignKeyMapping).length

  const foreignKeyPrecision =
    predictCount === 0 ? 0 : matchedCount / predictCount
  const foreignKeyRecall =
    referenceCount === 0 ? 0 : matchedCount / referenceCount
  const foreignKeyF1 =
    foreignKeyPrecision + foreignKeyRecall === 0
      ? 0
      : (2 * foreignKeyPrecision * foreignKeyRecall) /
        (foreignKeyPrecision + foreignKeyRecall)
  const foreignKeyAllCorrect = Math.abs(foreignKeyF1 - 1) < EPSILON ? 1 : 0

  return { foreignKeyF1, foreignKeyAllCorrect }
}

export const evaluateForeignKeys = (
  referenceTables: Schema['tables'],
  predictTables: Schema['tables'],
) => {
  const foreignKeyMapping = createForeignKeyMapping(
    referenceTables,
    predictTables,
  )
  return calculateForeignKeyMetrics(
    referenceTables,
    predictTables,
    foreignKeyMapping,
  )
}
