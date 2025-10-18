import type { SchemaStatus } from '../../../GitHubSessionForm/SchemaInfoSection'

type HasContentParams = {
  selectedFile: File | null
  schemaStatus: SchemaStatus
  textContent: string
}

/**
 * Calculate whether the upload form has sufficient content to enable submission.
 *
 * Upload form allows submission when:
 * - A valid schema file with either text message or attachments
 * - OR text message only (without any file)
 *
 * @param params - Form state parameters
 * @returns true if form can be submitted, false otherwise
 */
export const calculateHasContent = ({
  selectedFile,
  schemaStatus,
  textContent,
}: HasContentParams): boolean => {
  const hasValidSchemaFile = !!selectedFile && schemaStatus === 'valid'
  const hasTextContent = textContent.trim().length > 0
  // Case 1: Valid schema file with text
  const validFileWithContent = hasValidSchemaFile && hasTextContent

  // Case 2: Text message only (no file required)
  const textOnly = hasTextContent && !selectedFile

  return validFileWithContent || textOnly
}
