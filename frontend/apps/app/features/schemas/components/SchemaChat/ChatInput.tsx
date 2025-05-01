'use client'

import { Button } from '@liam-hq/ui'
import { SendIcon } from 'lucide-react'
import {
  type ChangeEventHandler,
  type FC,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
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

  // 高さ調整のための関数
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    // リサイズの前に高さをリセット
    textarea.style.height = 'auto'

    // スクロール高さに基づいて高さを設定（最大値あり）
    const maxHeight = 200
    const scrollHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${scrollHeight}px`

    // 最大高さを超える場合はスクロールを有効に
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  // 値が変更された時だけ高さを調整
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // デバウンスのためにsetTimeoutを使用
    const timeoutId = setTimeout(() => {
      adjustTextareaHeight()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [value])

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
        onChange={(e) => {
          onChange(e)
          // メモ化のため、useEffectではなくonChangeで直接高さを調整
          adjustTextareaHeight()
        }}
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
