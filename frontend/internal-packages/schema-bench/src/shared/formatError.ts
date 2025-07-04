import type { WorkspaceError } from '../workspace/types'

export const formatError = (error: WorkspaceError): string => {
  switch (error.type) {
    case 'DIRECTORY_NOT_FOUND':
      return `Directory not found: ${error.path}`
    case 'FILE_READ_ERROR':
      return `Failed to read file at ${error.path}: ${error.cause}`
    case 'FILE_WRITE_ERROR':
      return `Failed to write file at ${error.path}: ${error.cause}`
    case 'JSON_PARSE_ERROR':
      return `Failed to parse JSON at ${error.path}: ${error.cause}`
    case 'SCHEMA_NOT_FOUND':
      return `${error.schemaType} schema not found for case: ${error.caseId}`
    case 'VALIDATION_ERROR':
      return `Validation error: ${error.message}`
    case 'EVALUATION_ERROR':
      return `Evaluation failed for case ${error.caseId}: ${error.cause}`
    default:
      return 'Unknown error occurred'
  }
}
