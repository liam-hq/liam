const WORKFLOW_KEY_PREFIX = 'liam:workflow:'

/**
 * Get whether workflow is in progress
 */
export const getWorkflowInProgress = (designSessionId: string): boolean => {
  if (typeof window === 'undefined') return false
  const key = `${WORKFLOW_KEY_PREFIX}${designSessionId}`
  return sessionStorage.getItem(key) === 'in_progress'
}

/**
 * Set workflow in progress flag
 */
export const setWorkflowInProgress = (designSessionId: string): void => {
  if (typeof window === 'undefined') return
  const key = `${WORKFLOW_KEY_PREFIX}${designSessionId}`
  sessionStorage.setItem(key, 'in_progress')
}

/**
 * Clear workflow in progress flag
 */
export const clearWorkflowInProgress = (designSessionId: string): void => {
  if (typeof window === 'undefined') return
  const key = `${WORKFLOW_KEY_PREFIX}${designSessionId}`
  sessionStorage.removeItem(key)
}
