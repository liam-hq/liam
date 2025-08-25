import { PATH_PATTERNS } from '../../constants.js'
import type { Operation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

type Params = {
  tableId: string
  constraintId: string
  operations: Operation[]
}

export const getConstraintDetailChangeStatus = ({
  tableId,
  constraintId,
  operations,
}: Params) => {
  const filteredOperations = operations.filter((op) => {
    const match = op.path.match(PATH_PATTERNS.CONSTRAINT_DETAIL)
    return match !== null && match[1] === tableId && match[2] === constraintId
  })

  return determineChangeStatus({ operations: filteredOperations })
}
