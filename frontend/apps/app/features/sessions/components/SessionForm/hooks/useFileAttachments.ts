import { nanoid } from 'nanoid'
import { useCallback, useState } from 'react'

export interface FileAttachment {
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

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].url)
      updated.splice(index, 1)
      return updated
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
