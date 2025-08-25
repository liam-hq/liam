import { PATH_PATTERNS } from '../../constants.js'
import type { Operation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

const INDEX_RELATED_PATH_PATTERN = [
  PATH_PATTERNS.INDEX_BASE,
  PATH_PATTERNS.INDEX_NAME,
  PATH_PATTERNS.INDEX_UNIQUE,
  PATH_PATTERNS.INDEX_COLUMNS,
  PATH_PATTERNS.INDEX_COLUMNS_ELEMENT,
  PATH_PATTERNS.INDEX_TYPE,
]

type Params = {
  tableId: string
  indexId?: string
  operations: Operation[]
}

export const getIndexRelatedChangeStatus = ({
  tableId,
  indexId,
  operations,
}: Params) => {
  const filteredOperations = operations.filter((op) => {
    return INDEX_RELATED_PATH_PATTERN.some((pattern) => {
      const match = op.path.match(pattern)
      if (match === null || match[1] !== tableId) {
        return false
      }

      // If indexId is provided, filter by it; otherwise include all columns
      return indexId === undefined || match[2] === indexId
    })
  })

  return determineChangeStatus({
    operations: filteredOperations,
    customModificationChecker: (operations) =>
      operations.some((op) =>
        PATH_PATTERNS.INDEX_COLUMNS_ELEMENT.test(op.path),
      ),
  })
}
