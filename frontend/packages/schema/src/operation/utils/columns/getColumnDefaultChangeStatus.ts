import { PATH_PATTERNS } from '../../constants.js'
import type { Operation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

type Params = {
  tableId: string
  columnId: string
  operations: Operation[]
}

export const getColumnDefaultChangeStatus = ({
  tableId,
  columnId,
  operations,
}: Params) => {
  const filteredOperations = operations.filter((op) => {
    const match = op.path.match(PATH_PATTERNS.COLUMN_DEFAULT)
    return match !== null && match[1] === tableId && match[2] === columnId
  })

  return determineChangeStatus({ operations: filteredOperations })
}
