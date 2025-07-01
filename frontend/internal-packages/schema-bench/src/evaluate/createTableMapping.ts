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
