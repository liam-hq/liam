import { PATH_PATTERNS } from '../../constants.js'
import type { TableChangeParams } from '../base/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

const TABLE_RELATED_PATH_PATTERN = [
  PATH_PATTERNS.TABLE_BASE,
  PATH_PATTERNS.TABLE_NAME,
  PATH_PATTERNS.TABLE_COMMENT,
]

export const getTableRelatedChangeStatus = ({
  tableId,
  operations,
}: TableChangeParams) => {
  const filteredOperations = operations.filter((op) => {
    return TABLE_RELATED_PATH_PATTERN.some((pattern) => {
      const match = op.path.match(pattern)
      return match !== null && match[1] === tableId
    })
  })

  return determineChangeStatus({ operations: filteredOperations })
}
