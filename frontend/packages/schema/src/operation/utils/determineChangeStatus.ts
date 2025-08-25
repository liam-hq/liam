import type { ChangeStatus, Operation } from '../index.js'

type Params = {
  operations: Operation[]
  /**
   * Custom logic to determine if operations should be considered as 'modified'
   * even if they would normally be classified as 'added' or 'removed'
   */
  customModificationChecker?: (operations: Operation[]) => boolean
}

export function determineChangeStatus({
  operations,
  customModificationChecker,
}: Params): ChangeStatus {
  if (operations.length === 0) return 'unchanged'

  // Check custom modification logic first
  if (customModificationChecker?.(operations)) {
    return 'modified'
  }

  if (operations.some((op) => op.op === 'replace')) {
    return 'modified'
  }

  const hasAddOperation = operations.some((op) => op.op === 'add')
  const hasRemoveOperation = operations.some((op) => op.op === 'remove')

  if (hasAddOperation && hasRemoveOperation) {
    return 'modified'
  }

  if (hasAddOperation) return 'added'
  if (hasRemoveOperation) return 'removed'

  return 'unchanged'
}
