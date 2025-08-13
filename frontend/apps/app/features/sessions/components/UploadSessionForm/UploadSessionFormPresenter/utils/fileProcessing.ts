import type { FormatType } from '@/components/FormatIcon/FormatIcon'
import type { SchemaStatus } from '../../../GitHubSessionForm/SchemaInfoSection'
import { getFileFormat, isValidFileExtension } from './fileValidation'

export const processUploadedFile = (
  file: File,
  fileInputRef: React.RefObject<HTMLInputElement | null>,
) => {
  const isValid = isValidFileExtension(file.name)
  const status: SchemaStatus = isValid ? 'valid' : 'invalid'

  // Create a new FileList and set it to the input element
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)
  if (fileInputRef.current) {
    fileInputRef.current.files = dataTransfer.files
  }

  let detectedFormat: FormatType | null = null
  let selectedFormat: FormatType | null = null

  if (isValid) {
    const format = getFileFormat(file.name)
    detectedFormat = format
    selectedFormat = format
  }

  return {
    status,
    detectedFormat,
    selectedFormat,
  }
}
