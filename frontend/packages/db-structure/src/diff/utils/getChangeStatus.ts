import type { Operation } from 'fast-json-patch'
import type { PATH_PATTERNS } from '../constants.js'
import type { ChangeStatus } from '../types.js'

type PathPatternValue = (typeof PATH_PATTERNS)[keyof typeof PATH_PATTERNS]

type Params = {
  tableId: string
  columnId?: string
  indexId?: string
  operations: Operation[]
  pathRegExp: PathPatternValue
}

export function getChangeStatus({
  tableId,
  columnId,
  indexId,
  operations,
  pathRegExp,
}: Params): ChangeStatus {
  const filteredOperations = operations.filter(({ path }) => {
    const match = path.match(pathRegExp)

    if (columnId) {
      return match?.[1] === tableId && match?.[2] === columnId
    }

    if (indexId) {
      return match?.[1] === tableId && match?.[2] === indexId
    }

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
