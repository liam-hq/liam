'use client'

import { Button } from '@liam-hq/ui'
import { SendIcon } from 'lucide-react'
import {
  type ChangeEventHandler,
  type FC,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState
} from 'react'
import styles from './ChatInput.module.css'

interface ChatInputProps {
  value: string
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
  isLoading: boolean
  onSubmit?: () => void
}

export const ChatInput: FC<ChatInputProps> = ({
  value,
  onChange,
  isLoading,
  onSubmit,
}) => {
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Adjust height when value changes
  useEffect(() => {
    // Auto-resize the textarea based on content
    const adjustTextareaHeight = () => {
      const textarea = textareaRef.current
      if (textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto'

        // Set the height to scrollHeight to fit the content
        // Set max-height to prevent excessive growth
        const maxHeight = 200 // Maximum height in pixels
        const scrollHeight = Math.min(textarea.scrollHeight, maxHeight)
        textarea.style.height = `${scrollHeight}px`

        // If content exceeds maxHeight, enable scrolling
        textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
      }
    }

    adjustTextareaHeight()
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't submit if Shift is pressed or if currently composing (IME input)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      if (value.trim() && !isLoading && onSubmit) {
        onSubmit()
      }
    }
  }

  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder="Ask about your schema... (Shift+Enter for new line)"
        disabled={isLoading}
        className={styles.input}
        rows={1}
      />
      <Button
        type="submit"
        disabled={!value.trim() || isLoading}
        isLoading={isLoading}
        className={styles.sendButton}
        aria-label="Send message"
        loadingIndicatorType="content"
      >
        <SendIcon size={18} />
      </Button>
    </>
  )
}
