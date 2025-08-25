import { PATH_PATTERNS } from '../../constants.js'
import type { Operation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

type Params = {
  tableId: string
  operations: Operation[]
}

export const getTableCommentChangeStatus = ({
  tableId,
  operations,
}: Params) => {
  const filteredOperations = operations.filter((op) => {
    const match = op.path.match(PATH_PATTERNS.TABLE_COMMENT)
    return match !== null && match[1] === tableId
  })

  return determineChangeStatus({ operations: filteredOperations })
}
