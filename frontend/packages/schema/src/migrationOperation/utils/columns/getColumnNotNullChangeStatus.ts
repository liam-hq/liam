import { PATH_PATTERNS } from '../../constants.js'
import type { MigrationOperation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

type Params = {
  tableId: string
  columnId: string
  operations: MigrationOperation[]
}

export const getColumnNotNullChangeStatus = ({
  tableId,
  columnId,
  operations,
}: Params) => {
  const filteredOperations = operations.filter((op) => {
    const match = op.path.match(PATH_PATTERNS.COLUMN_NOT_NULL)
    return match !== null && match[1] === tableId && match[2] === columnId
  })

  return determineChangeStatus({ operations: filteredOperations })
}
