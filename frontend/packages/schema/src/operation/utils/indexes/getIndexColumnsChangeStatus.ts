import { PATH_PATTERNS } from '../../constants.js'
import type { Operation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

type Params = {
  tableId: string
  indexId: string
  operations: Operation[]
}

export const getIndexColumnsChangeStatus = ({
  tableId,
  indexId,
  operations,
}: Params) => {
  const filteredOperations = operations.filter((op) => {
    const match = op.path.match(PATH_PATTERNS.INDEX_COLUMNS)
    return match !== null && match[1] === tableId && match[2] === indexId
  })

  return determineChangeStatus({ operations: filteredOperations })
}
