import { PATH_PATTERNS } from '../../constants.js'
import type { Operation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

const COLUMN_RELATED_PATH_PATTERN = [
  PATH_PATTERNS.COLUMN_BASE,
  PATH_PATTERNS.COLUMN_NAME,
  PATH_PATTERNS.COLUMN_TYPE,
  PATH_PATTERNS.COLUMN_COMMENT,
  PATH_PATTERNS.COLUMN_DEFAULT,
  PATH_PATTERNS.COLUMN_CHECK,
  PATH_PATTERNS.COLUMN_NOT_NULL,
]

type Params = {
  tableId: string
  columnId?: string
  operations: Operation[]
}

export const getColumnRelatedChangeStatus = ({
  tableId,
  columnId,
  operations,
}: Params) => {
  const filteredOperations = operations.filter((op) => {
    return COLUMN_RELATED_PATH_PATTERN.some((pattern) => {
      const match = op.path.match(pattern)
      if (match === null || match[1] !== tableId) {
        return false
      }
      // If columnId is provided, filter by it; otherwise include all columns
      return columnId === undefined || match[2] === columnId
    })
  })

  return determineChangeStatus({ operations: filteredOperations })
}
