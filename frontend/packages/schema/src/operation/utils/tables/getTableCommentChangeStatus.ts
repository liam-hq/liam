import { PATH_PATTERNS } from '../../constants.js'
import type { TableChangeParams } from '../base/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

export const getTableCommentChangeStatus = ({
  tableId,
  operations,
}: TableChangeParams) => {
  const filteredOperations = operations.filter((op) => {
    const match = op.path.match(PATH_PATTERNS.TABLE_COMMENT)
    return match !== null && match[1] === tableId
  })

  return determineChangeStatus({ operations: filteredOperations })
}
