import type { Operation } from 'fast-json-patch'
import type { PATH_PATTERNS } from '../constants.js'
import type { ChangeStatus } from '../types.js'

type PathPatternValue = (typeof PATH_PATTERNS)[keyof typeof PATH_PATTERNS]

type Params = {
  tableId: string
  operations: Operation[]
  pathRegExp: PathPatternValue
}

export function getChangeStatus({
  tableId,
  operations,
  pathRegExp,
}: Params): ChangeStatus {
  const filteredOperations = operations.filter(({ path }) => {
    const match = path.match(pathRegExp)
    return match && match[1] === tableId
  })

  if (filteredOperations.length === 0) return 'unchanged'

  if (filteredOperations.some((op) => op.op === 'replace')) {
    return 'modified'
  }

  const hasAddOperation = filteredOperations.some((op) => op.op === 'add')
  const hasRemoveOperation = filteredOperations.some((op) => op.op === 'remove')

  // Return 'modified' if both add and remove operations exist
  if (hasAddOperation && hasRemoveOperation) {
    return 'modified'
  }

  if (hasAddOperation) return 'added'
  if (hasRemoveOperation) return 'removed'

  return 'unchanged'
}
