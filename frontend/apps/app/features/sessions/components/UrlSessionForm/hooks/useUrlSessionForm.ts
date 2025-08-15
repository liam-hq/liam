import { useState } from 'react'
import type { SchemaStatus } from '../../GitHubSessionForm/SchemaInfoSection'

type UrlSessionFormState = {
  urlPath: string
  textContent: string
  setUrlPath: (value: string) => void
  setTextContent: (value: string) => void
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  resetFormState: () => void
}

export const useUrlSessionForm = (
  onUrlChange?: (schemaStatus: SchemaStatus) => void,
): UrlSessionFormState => {
  const [urlPath, setUrlPath] = useState('')
  const [textContent, setTextContent] = useState('')

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlPath(e.target.value)
    // Reset schema status when URL changes
    if (onUrlChange) {
      onUrlChange('idle')
    }
  }

  const resetFormState = () => {
    setUrlPath('')
    setTextContent('')
  }

  return {
    urlPath,
    textContent,
    setUrlPath,
    setTextContent,
    handleUrlChange,
    resetFormState,
  }
}
