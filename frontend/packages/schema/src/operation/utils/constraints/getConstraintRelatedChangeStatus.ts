import { PATH_PATTERNS } from '../../constants.js'
import type { Operation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

const CONSTRAINT_RELATED_PATH_PATTERN = [
  PATH_PATTERNS.CONSTRAINT_BASE,
  PATH_PATTERNS.CONSTRAINT_NAME,
  PATH_PATTERNS.CONSTRAINT_COLUMN_NAMES_ARRAY,
  PATH_PATTERNS.CONSTRAINT_TYPE,
  PATH_PATTERNS.CONSTRAINT_COLUMN_NAME,
  PATH_PATTERNS.CONSTRAINT_TARGET_TABLE_NAME,
  PATH_PATTERNS.CONSTRAINT_TARGET_COLUMN_NAME,
  PATH_PATTERNS.CONSTRAINT_UPDATE_CONSTRAINT,
  PATH_PATTERNS.CONSTRAINT_DELETE_CONSTRAINT,
  PATH_PATTERNS.CONSTRAINT_DETAIL,
]

type Params = {
  tableId: string
  constraintId?: string
  operations: Operation[]
}

export const getConstraintRelatedChangeStatus = ({
  tableId,
  constraintId,
  operations,
}: Params) => {
  const filteredOperations = operations.filter((op) => {
    return CONSTRAINT_RELATED_PATH_PATTERN.some((pattern) => {
      const match = op.path.match(pattern)
      if (match === null || match[1] !== tableId) {
        return false
      }

      // If constraintId is provided, filter by it; otherwise include all columns
      return constraintId === undefined || match[2] === constraintId
    })
  })

  return determineChangeStatus({ operations: filteredOperations })
}
