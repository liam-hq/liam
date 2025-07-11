import { nanoid } from 'nanoid'
import { useCallback, useState } from 'react'

export type FileAttachment = {
  id: string
  url: string
  name: string
}

export const useFileAttachments = () => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

  const handleFileSelect = useCallback((files: FileList) => {
    const newAttachments = Array.from(files).map((file) => ({
      id: nanoid(),
      url: URL.createObjectURL(file),
      name: file.name,
    }))
    setAttachments((prev) => [...prev, ...newAttachments])
  }, [])

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachmentToRemove = prev.find((attachment) => attachment.id === id)
      if (attachmentToRemove) {
        URL.revokeObjectURL(attachmentToRemove.url)
      }
      return prev.filter((attachment) => attachment.id !== id)
    })
  }, [])

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((attachment) => {
        URL.revokeObjectURL(attachment.url)
      })
      return []
    })
  }, [])

  return {
    attachments,
    handleFileSelect,
    handleRemoveAttachment,
    clearAttachments,
  }
}
