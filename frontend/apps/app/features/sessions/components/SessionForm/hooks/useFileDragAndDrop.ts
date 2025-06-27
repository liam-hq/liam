import { type DragEvent, useCallback, useRef, useState } from 'react'

export const useFileDragAndDrop = (
  onFilesDropped?: (files: FileList) => void,
) => {
  const [dragActive, setDragActive] = useState(false)
  const dragCounter = useRef(0)

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter') {
      dragCounter.current++
      if (dragCounter.current === 1) {
        setDragActive(true)
      }
    } else if (e.type === 'dragleave') {
      dragCounter.current--
      if (dragCounter.current === 0) {
        setDragActive(false)
      }
    } else if (e.type === 'dragover') {
      e.preventDefault()
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = 0
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesDropped?.(e.dataTransfer.files)
      }
    },
    [onFilesDropped],
  )

  return {
    dragActive,
    handleDrag,
    handleDrop,
  }
}
