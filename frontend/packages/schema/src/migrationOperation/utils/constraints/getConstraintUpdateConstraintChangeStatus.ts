import { PATH_PATTERNS } from '../../constants.js'
import type { MigrationOperation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

type Params = {
  tableId: string
  constraintId: string
  operations: MigrationOperation[]
}

export const getConstraintUpdateConstraintChangeStatus = ({
  tableId,
  constraintId,
  operations,
}: Params) => {
  const filteredOperations = operations.filter((op) => {
    const match = op.path.match(PATH_PATTERNS.CONSTRAINT_UPDATE_CONSTRAINT)
    return match !== null && match[1] === tableId && match[2] === constraintId
  })

  return determineChangeStatus({ operations: filteredOperations })
}
