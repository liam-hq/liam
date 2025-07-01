import { nameSimilarity } from '../nameSimilarity/nameSimilarity.ts'
import { wordOverlapMatch } from '../wordOverlapMatch/wordOverlapMatch.ts'
import type { Mapping } from './types.ts'

export const createTableMapping = async (
  referenceTableNames: string[],
  predictTableNames: string[],
): Promise<Mapping> => {
  const tableMapping: Mapping = {}

  // NOTE: Implement synonym matching if needed
  // --- (0) synonym matching

  // --- (1) name similarity matching
  await nameSimilarity(referenceTableNames, predictTableNames, tableMapping)

  // --- (2) word overlap matching
  wordOverlapMatch(referenceTableNames, predictTableNames, tableMapping)

  return tableMapping
}

export const calculateTableMetrics = (
  referenceTableNames: string[],
  predictTableNames: string[],
  tableMapping: Mapping,
) => {
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

  return { tableF1, tableAllcorrect }
}
