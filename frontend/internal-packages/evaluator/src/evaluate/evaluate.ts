/**
 * Database Schema Evaluation Script
 *
 * This script evaluates the accuracy of predicted database schemas against reference schemas.
 * It performs comprehensive matching and scoring across multiple dimensions:
 * - Schema name mapping using word overlap and semantic similarity
 * - Attribute name matching within each schema
 * - Primary key validation
 * - Foreign key validation
 *
 * The evaluation produces metrics including F1 scores, precision/recall, and all-correct rates
 * to assess the quality of schema prediction models or tools.
 */
import { nameSimilarity } from '../nameSimilarity'
import { wordOverlapMatch } from '../wordOverlapMatch'

type Schema = {
  Attributes: string[]
  'Primary key': string[]
  // biome-ignore lint/suspicious/noExplicitAny: now poc
  'Foreign key'?: Record<string, any>
  // Add more if needed
}
export type Schemas = Record<string, Schema>
type Mapping = Record<string, string>

type EvaluateResult = {
  schemaMapping: Mapping
  attributeMapping: Record<string, Mapping>
  schemaF1: number
  schemaAllcorrect: number
  attributeF1Avg: number
  attributeAllcorrectAvg: number
  primaryKeyAvg: number
  foreignKeyAvg: number
  schemaAllcorrectFull: number
}

// Synonym matching is omitted (use if already implemented, otherwise skip initially)

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: now poc
export async function evaluate(
  reference: Schemas,
  predict: Schemas,
): Promise<EvaluateResult> {
  const referenceSchemaNames = Object.keys(reference)
  const predictSchemaNames = Object.keys(predict)

  // 1. Schema name mapping
  const schemaMapping: Mapping = {}

  // --- (1) synonym matching (if needed)
  // await matchSynonyms(referenceSchemaNames, predictSchemaNames, schemaMapping);

  // --- (2) sent_overlap matching
  wordOverlapMatch(referenceSchemaNames, predictSchemaNames, schemaMapping)

  // --- (3) name similarity matching
  await nameSimilarity(referenceSchemaNames, predictSchemaNames, schemaMapping)

  // 2. Precision/Recall/F1/Allcorrect
  const schemaPrecision =
    predictSchemaNames.length === 0
      ? 0
      : Object.keys(schemaMapping).length / predictSchemaNames.length
  const schemaRecall =
    referenceSchemaNames.length === 0
      ? 0
      : Object.keys(schemaMapping).length / referenceSchemaNames.length
  const schemaF1 =
    schemaPrecision + schemaRecall === 0
      ? 0
      : (2 * schemaPrecision * schemaRecall) / (schemaPrecision + schemaRecall)
  const schemaAllcorrect = schemaF1 === 1 ? 1 : 0

  // 3. Each schema attributes, PK, FK
  let sampleAttributeF1 = 0
  let sampleAttributeAllcorrect = 0
  let samplePrimaryKey = 0
  let sampleForeignKey = 0
  const sampleAttributeMapping: Record<string, Mapping> = {}

  for (const schemaName of Object.keys(schemaMapping)) {
    const referenceAttributes = reference[schemaName]?.Attributes ?? []
    const predictSchemaName = schemaMapping[schemaName]
    if (!predictSchemaName) continue
    const predictAttributes = predict[predictSchemaName]?.Attributes ?? []
    const attributeMapping: Mapping = {}

    // --- Attribute name matching
    // (1) synonym matching (optional)
    // await matchSynonyms(referenceAttributes, predictAttributes, attributeMapping);

    // (2) name similarity
    await nameSimilarity(
      referenceAttributes,
      predictAttributes,
      attributeMapping,
    )

    // (3) sent_overlap
    wordOverlapMatch(referenceAttributes, predictAttributes, attributeMapping)

    sampleAttributeMapping[schemaName] = attributeMapping

    // F1/Allcorrect
    const attributePrecision =
      predictAttributes.length === 0
        ? 0
        : Object.keys(attributeMapping).length / predictAttributes.length
    const attributeRecall =
      referenceAttributes.length === 0
        ? 0
        : Object.keys(attributeMapping).length / referenceAttributes.length
    const attributeF1 =
      attributePrecision + attributeRecall === 0
        ? 0
        : (2 * attributePrecision * attributeRecall) /
          (attributePrecision + attributeRecall + 1e-5)

    sampleAttributeF1 += attributeF1
    sampleAttributeAllcorrect += Math.abs(attributeF1 - 1) < 1e-3 ? 1 : 0

    // Primary key
    const referencePKs = reference[schemaName]?.['Primary key'] ?? []
    const predictPKs = predict[predictSchemaName]?.['Primary key'] ?? []
    let pkFlag = false
    if (referencePKs.length === predictPKs.length) {
      pkFlag = referencePKs.every(
        (k) => attributeMapping[k] && predictPKs.includes(attributeMapping[k]),
      )
    }
    samplePrimaryKey += pkFlag ? 1 : 0

    // Foreign key (minimal check: only count)
    const referenceFKs = reference[schemaName]?.['Foreign key'] || {}
    const predictFKs = predict[predictSchemaName]?.['Foreign key'] || {}
    let fkFlag = false
    if (Object.keys(referenceFKs).length === Object.keys(predictFKs).length) {
      fkFlag = true
      // Strict comparison is TODO
    }
    sampleForeignKey += fkFlag ? 1 : 0
  }

  const sampleCount = referenceSchemaNames.length
  const attributeF1Avg = sampleCount ? sampleAttributeF1 / sampleCount : 0
  const attributeAllcorrectAvg = sampleCount
    ? sampleAttributeAllcorrect / sampleCount
    : 0
  const primaryKeyAvg = sampleCount ? samplePrimaryKey / sampleCount : 0
  const foreignKeyAvg = sampleCount ? sampleForeignKey / sampleCount : 0

  const schemaAllcorrectFull =
    primaryKeyAvg + foreignKeyAvg + attributeAllcorrectAvg + schemaAllcorrect >
    3.9
      ? 1
      : 0

  return {
    schemaMapping,
    attributeMapping: sampleAttributeMapping,
    schemaF1,
    schemaAllcorrect,
    attributeF1Avg,
    attributeAllcorrectAvg,
    primaryKeyAvg,
    foreignKeyAvg,
    schemaAllcorrectFull,
  }
}
