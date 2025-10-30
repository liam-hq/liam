import { PATH_PATTERNS } from '../../constants.js'
import type { MigrationOperation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

type Params = {
  tableId: string
  indexId: string
  operations: MigrationOperation[]
}

export const getIndexNameChangeStatus = ({
  tableId,
  indexId,
  operations,
}: Params) => {
  const filteredOperations = operations.filter((op) => {
    const match = op.path.match(PATH_PATTERNS.INDEX_NAME)
    return match !== null && match[1] === tableId && match[2] === indexId
  })

  return determineChangeStatus({ operations: filteredOperations })
}
