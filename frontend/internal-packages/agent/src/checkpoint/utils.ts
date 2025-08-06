/**
 * Utility functions for checkpoint operations
 */

/**
 * Validates thread_id format
 */
export const validateThreadId = (threadId: string): boolean => {
  return typeof threadId === 'string' && threadId.trim().length > 0
}

/**
 * Validates checkpoint_id format
 */
export const validateCheckpointId = (checkpointId: string): boolean => {
  return typeof checkpointId === 'string' && checkpointId.trim().length > 0
}

/**
 * Validates organization_id format
 */
export const validateOrganizationId = (organizationId: string): boolean => {
  return typeof organizationId === 'string' && organizationId.trim().length > 0
}

/**
 * Sanitizes checkpoint namespace (ensures it's never null/undefined)
 */
export const sanitizeCheckpointNamespace = (ns?: string): string => {
  return ns?.trim() ?? ''
}

/**
 * Creates a unique key for checkpoint blob storage
 */
export const createBlobKey = (
  threadId: string,
  checkpointNs: string,
  channel: string,
  version: string,
): string => {
  return `${threadId}:${checkpointNs}:${channel}:${version}`
}

/**
 * Creates a unique key for checkpoint write storage
 */
export const createWriteKey = (
  threadId: string,
  checkpointNs: string,
  checkpointId: string,
  taskId: string,
  idx: number,
): string => {
  return `${threadId}:${checkpointNs}:${checkpointId}:${taskId}:${idx}`
}
