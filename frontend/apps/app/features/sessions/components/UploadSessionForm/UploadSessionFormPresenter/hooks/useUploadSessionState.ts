import { useRef, useState } from 'react'
import type { FormatType } from '@/components/FormatIcon/FormatIcon'
import type { SchemaStatus } from '../../../GitHubSessionForm/SchemaInfoSection'

export const useUploadSessionState = () => {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<FormatType | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<FormatType | null>(null)
  const [textContent, setTextContent] = useState('')
  const [schemaStatus, setSchemaStatus] = useState<SchemaStatus>('idle')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const resetState = () => {
    setSelectedFile(null)
    setDetectedFormat(null)
    setSelectedFormat(null)
    setTextContent('')
    setSchemaStatus('idle')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resetSchemaState = () => {
    setSelectedFile(null)
    setSchemaStatus('idle')
    setDetectedFormat(null)
    setSelectedFormat(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return {
    // State
    isHovered,
    selectedFile,
    detectedFormat,
    selectedFormat,
    textContent,
    schemaStatus,

    // Refs
    fileInputRef,
    textareaRef,
    formRef,

    // State setters
    setIsHovered,
    setSelectedFile,
    setDetectedFormat,
    setSelectedFormat,
    setTextContent,
    setSchemaStatus,

    // Helper functions
    resetState,
    resetSchemaState,
  }
}
