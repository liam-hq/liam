import { useState } from 'react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import type { SchemaStatus } from '../../GitHubSessionForm/SchemaInfoSection'
import {
  fetchSchemaFromUrl,
  getFormatFromUrl,
  isValidSchemaUrl,
} from '../utils/urlValidation'

type SchemaFetchResult = {
  schemaStatus: SchemaStatus
  schemaContent: string | null
  detectedFormat: FormatType
  selectedFormat: FormatType
  schemaError: string | null
  schemaErrorDetails: string[]
  setSelectedFormat: (format: FormatType) => void
  handleFetchSchema: (url: string) => Promise<void>
  resetSchemaState: () => void
}

const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return { isValid: false, error: 'Please enter a URL' }
  }

  if (!isValidSchemaUrl(trimmedUrl)) {
    return {
      isValid: false,
      error:
        'Invalid URL. Please provide a valid URL pointing to a schema file (.sql, .rb, .prisma, or .json).',
    }
  }

  return { isValid: true }
}

const handleSchemaError = (
  error: string,
  setSchemaStatus: (status: SchemaStatus) => void,
  setSchemaError: (error: string | null) => void,
  setSchemaErrorDetails: (details: string[]) => void,
) => {
  setSchemaStatus('invalid')
  setSchemaError(error)
  setSchemaErrorDetails([])
}

export const useSchemaFetch = (): SchemaFetchResult => {
  const [schemaStatus, setSchemaStatus] = useState<SchemaStatus>('idle')
  const [schemaContent, setSchemaContent] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('postgres')
  const [detectedFormat, setDetectedFormat] = useState<FormatType>('postgres')
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [schemaErrorDetails, setSchemaErrorDetails] = useState<string[]>([])

  const handleFetchSchema = async (url: string) => {
    const validation = validateUrl(url)
    if (!validation.isValid) {
      if (validation.error) {
        handleSchemaError(
          validation.error,
          setSchemaStatus,
          setSchemaError,
          setSchemaErrorDetails,
        )
      }
      return
    }

    setSchemaStatus('validating')
    setSchemaError(null)
    setSchemaErrorDetails([])

    try {
      const result = await fetchSchemaFromUrl(url.trim())

      if (result.success && result.content) {
        const format = getFormatFromUrl(url)
        setSchemaStatus('valid')
        setSchemaContent(result.content)
        setDetectedFormat(format)
        setSelectedFormat(format)
      } else {
        handleSchemaError(
          result.error || 'Failed to fetch schema',
          setSchemaStatus,
          setSchemaError,
          setSchemaErrorDetails,
        )
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `An error occurred while fetching the schema: ${error.message}`
          : 'An unexpected error occurred while fetching the schema'
      handleSchemaError(
        errorMessage,
        setSchemaStatus,
        setSchemaError,
        setSchemaErrorDetails,
      )
    }
  }

  const resetSchemaState = () => {
    setSchemaStatus('idle')
    setSchemaContent(null)
    setSelectedFormat('postgres')
    setDetectedFormat('postgres')
    setSchemaError(null)
    setSchemaErrorDetails([])
  }

  return {
    schemaStatus,
    schemaContent,
    detectedFormat,
    selectedFormat,
    schemaError,
    schemaErrorDetails,
    setSelectedFormat,
    handleFetchSchema,
    resetSchemaState,
  }
}
