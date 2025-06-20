/**
 * Database Schema Evaluation Script
 *
 * This script evaluates the accuracy of predicted database schemas against reference schemas.
 * It performs comprehensive matching and scoring across multiple dimensions:
 * - Table name mapping using word overlap and semantic similarity
 * - Column name matching within each table
 * - Primary key validation
 * - Foreign key validation
 * - Relationship validation
 * - Constraint validation
 *
 * The evaluation produces metrics including F1 scores, precision/recall, and all-correct rates
 * to assess the quality of schema prediction models or tools.
 */
import type {
  ForeignKeyConstraint,
  PrimaryKeyConstraint,
  Schema,
} from '../../../../packages/db-structure/src/schema/schema'
import { nameSimilarity } from '../nameSimilarity'
import { wordOverlapMatch } from '../wordOverlapMatch'

type Mapping = Record<string, string>

type EvaluateResult = {
  tableMapping: Mapping
  columnMapping: Record<string, Mapping>
  relationshipMapping: Mapping
  tableF1: number
  tableAllcorrect: number
  columnF1Avg: number
  columnAllcorrectAvg: number
  primaryKeyAvg: number
  foreignKeyAvg: number
  relationshipF1: number
  relationshipAllcorrect: number
  constraintAccuracy: number
  schemaAllcorrectFull: number
}

// Synonym matching is omitted (use if already implemented, otherwise skip initially)

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: now poc
export async function evaluate(
  reference: Schema,
  predict: Schema,
): Promise<EvaluateResult> {
  const referenceTableNames = Object.keys(reference.tables)
  const predictTableNames = Object.keys(predict.tables)

  // 1. Table name mapping
  const tableMapping: Mapping = {}

  // --- (1) synonym matching (if needed)
  // await matchSynonyms(referenceTableNames, predictTableNames, tableMapping);

  // --- (2) sent_overlap matching
  wordOverlapMatch(referenceTableNames, predictTableNames, tableMapping)

  // --- (3) name similarity matching
  await nameSimilarity(referenceTableNames, predictTableNames, tableMapping)

  // 2. Table-level Precision/Recall/F1/Allcorrect
  const tablePrecision =
    predictTableNames.length === 0
      ? 0
      : Object.keys(tableMapping).length / predictTableNames.length
  const tableRecall =
    referenceTableNames.length === 0
      ? 0
      : Object.keys(tableMapping).length / referenceTableNames.length
  const tableF1 =
    tablePrecision + tableRecall === 0
      ? 0
      : (2 * tablePrecision * tableRecall) / (tablePrecision + tableRecall)
  const tableAllcorrect = tableF1 === 1 ? 1 : 0

  // 3. Column-level evaluation for each matched table
  let sampleColumnF1 = 0
  let sampleColumnAllcorrect = 0
  let samplePrimaryKey = 0
  let sampleForeignKey = 0
  let sampleConstraint = 0
  const sampleColumnMapping: Record<string, Mapping> = {}

  for (const tableName of Object.keys(tableMapping)) {
    const referenceTable = reference.tables[tableName]
    const predictTableName = tableMapping[tableName]
    if (!predictTableName || !referenceTable) continue
    const predictTable = predict.tables[predictTableName]
    if (!predictTable) continue

    const referenceColumnNames = Object.keys(referenceTable.columns)
    const predictColumnNames = Object.keys(predictTable.columns)
    const columnMapping: Mapping = {}

    // --- Column name matching
    // (1) synonym matching (optional)
    // await matchSynonyms(referenceColumnNames, predictColumnNames, columnMapping);

    // (2) name similarity
    await nameSimilarity(
      referenceColumnNames,
      predictColumnNames,
      columnMapping,
    )

    // (3) sent_overlap
    wordOverlapMatch(referenceColumnNames, predictColumnNames, columnMapping)

    sampleColumnMapping[tableName] = columnMapping

    // Column F1/Allcorrect
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
        : (2 * columnPrecision * columnRecall) /
          (columnPrecision + columnRecall + 1e-5)

    sampleColumnF1 += columnF1
    sampleColumnAllcorrect += Math.abs(columnF1 - 1) < 1e-3 ? 1 : 0

    // Primary key validation
    const referencePKs = Object.values(referenceTable.constraints)
      .filter((c): c is PrimaryKeyConstraint => c.type === 'PRIMARY KEY')
      .map((c) => c.columnName)
    const predictPKs = Object.values(predictTable.constraints)
      .filter((c): c is PrimaryKeyConstraint => c.type === 'PRIMARY KEY')
      .map((c) => c.columnName)

    let pkFlag = false
    if (referencePKs.length === predictPKs.length) {
      pkFlag = referencePKs.every(
        (k: string) =>
          columnMapping[k] && predictPKs.includes(columnMapping[k]),
      )
    }
    samplePrimaryKey += pkFlag ? 1 : 0

    // Foreign key validation
    const referenceFKs = Object.values(referenceTable.constraints).filter(
      (c): c is ForeignKeyConstraint => c.type === 'FOREIGN KEY',
    )
    const predictFKs = Object.values(predictTable.constraints).filter(
      (c): c is ForeignKeyConstraint => c.type === 'FOREIGN KEY',
    )

    let fkFlag = false
    if (referenceFKs.length === predictFKs.length) {
      fkFlag = true
      // More detailed FK comparison can be added here
    }
    sampleForeignKey += fkFlag ? 1 : 0

    // Constraint validation (basic count comparison)
    const referenceConstraintCount = Object.keys(
      referenceTable.constraints,
    ).length
    const predictConstraintCount = Object.keys(predictTable.constraints).length
    sampleConstraint +=
      referenceConstraintCount === predictConstraintCount ? 1 : 0
  }

  // 4. Relationship evaluation
  const referenceRelationshipNames = Object.keys(reference.relationships)
  const predictRelationshipNames = Object.keys(predict.relationships)
  const relationshipMapping: Mapping = {}

  // Simple relationship name matching
  wordOverlapMatch(
    referenceRelationshipNames,
    predictRelationshipNames,
    relationshipMapping,
  )
  await nameSimilarity(
    referenceRelationshipNames,
    predictRelationshipNames,
    relationshipMapping,
  )

  const relationshipPrecision =
    predictRelationshipNames.length === 0
      ? 0
      : Object.keys(relationshipMapping).length /
        predictRelationshipNames.length
  const relationshipRecall =
    referenceRelationshipNames.length === 0
      ? 0
      : Object.keys(relationshipMapping).length /
        referenceRelationshipNames.length
  const relationshipF1 =
    relationshipPrecision + relationshipRecall === 0
      ? 0
      : (2 * relationshipPrecision * relationshipRecall) /
        (relationshipPrecision + relationshipRecall)
  const relationshipAllcorrect = relationshipF1 === 1 ? 1 : 0

  // Calculate averages
  const sampleCount = referenceTableNames.length
  const columnF1Avg = sampleCount ? sampleColumnF1 / sampleCount : 0
  const columnAllcorrectAvg = sampleCount
    ? sampleColumnAllcorrect / sampleCount
    : 0
  const primaryKeyAvg = sampleCount ? samplePrimaryKey / sampleCount : 0
  const foreignKeyAvg = sampleCount ? sampleForeignKey / sampleCount : 0
  const constraintAccuracy = sampleCount ? sampleConstraint / sampleCount : 0

  const schemaAllcorrectFull =
    primaryKeyAvg +
      foreignKeyAvg +
      columnAllcorrectAvg +
      tableAllcorrect +
      relationshipAllcorrect >
    4.9
      ? 1
      : 0

  return {
    tableMapping,
    columnMapping: sampleColumnMapping,
    relationshipMapping,
    tableF1,
    tableAllcorrect,
    columnF1Avg,
    columnAllcorrectAvg,
    primaryKeyAvg,
    foreignKeyAvg,
    relationshipF1,
    relationshipAllcorrect,
    constraintAccuracy,
    schemaAllcorrectFull,
  }
}
