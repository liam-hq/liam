import type { Mapping } from './types.ts'

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
