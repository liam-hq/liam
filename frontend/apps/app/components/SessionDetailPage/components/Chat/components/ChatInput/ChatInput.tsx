'use client'

import type { Schema } from '@liam-hq/db-structure'
import {
  PopoverAnchor,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
} from '@liam-hq/ui'
import clsx from 'clsx'
import {
  type ChangeEvent,
  type FC,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { DeepModelingToggle } from '@/features/sessions/components/shared/DeepModelingToggle'
import styles from './ChatInput.module.css'
import {
  type MentionItem,
  MentionSuggestor,
  type MentionSuggestorHandle,
} from './components/MentionSuggestor'
import { SendButton } from './components/SendButton'
import { handleNormalKey } from './utils/handleNormalKey'
import { insertMentionAtCursor } from './utils/insertMention'
import { isRegularKey } from './utils/isRegularKey'

type Props = {
  isWorkflowRunning: boolean
  error?: boolean
  initialMessage?: string
  schema: Schema
  onSendMessage: (message: string) => void
  isDeepModelingEnabled: boolean
  onDeepModelingToggle: (enabled: boolean) => void
}

export const ChatInput: FC<Props> = ({
  isWorkflowRunning,
  error = false,
  initialMessage = '',
  schema,
  onSendMessage,
  isDeepModelingEnabled,
  onDeepModelingToggle,
}) => {
  const mentionSuggestorRef = useRef<MentionSuggestorHandle>(null)
  const mentionSuggestorId = useId()

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [message, setMessage] = useState(initialMessage)
  const [cursorPos, setCursorPos] = useState(0)
  const [isMentionSuggestorOpen, setIsMentionSuggestorOpen] = useState(false)
  const [isImeComposing, setIsImeComposing] = useState(false)

  const hasContent = message.trim().length > 0

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Detect mention trigger
    const cursorPos = e.target.selectionStart
    setCursorPos(cursorPos)

    const before = value.slice(0, cursorPos)
    const atMatch = /@([\w-]*)$/.exec(before)

    if (atMatch) {
      setIsMentionSuggestorOpen(true)
    } else {
      setIsMentionSuggestorOpen(false)
    }

    // Adjust height after content changes
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  // Handle mention suggestion selection
  const handleMentionSelect = (item: MentionItem, byKeyboard?: boolean) => {
    setMessage((prev) => insertMentionAtCursor(prev, cursorPos, item))
    setIsMentionSuggestorOpen(false)

    if (byKeyboard) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }

  // When IME composition starts
  const handleCompositionStart = () => {
    setIsImeComposing(true)
  }

  // When IME composition ends
  const handleCompositionEnd = () => {
    setIsImeComposing(false)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (isWorkflowRunning || !hasContent) return

    onSendMessage(message)
    setMessage('')
    setTimeout(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = '24px'
      }
    }, 0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // First check for regular text input which is always allowed
    if (isRegularKey(e.key)) {
      return
    }

    // Then handle events based on whether mention suggestions are visible
    if (isMentionSuggestorOpen) {
      mentionSuggestorRef.current?.handleKeyDown(e)
    } else {
      handleNormalKey(e, {
        isImeComposing,
        hasContent,
        onSubmit: () => handleSubmit(e as unknown as FormEvent),
      })
    }
  }

  const handleClose = useCallback(() => {
    setIsMentionSuggestorOpen(false)
  }, [])

  // Adjust height on initial render
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  return (
    <div className={styles.container}>
      <form
        className={clsx(
          styles.inputContainer,
          isWorkflowRunning && styles.disabled,
          isWorkflowRunning && styles.loading,
          error && styles.error,
        )}
        onSubmit={handleSubmit}
      >
        <div className={styles.inputWrapper} style={{ position: 'relative' }}>
          {/* Use memoized props to avoid unnecessary renders */}
          <PopoverRoot
            open={isMentionSuggestorOpen}
            onOpenChange={setIsMentionSuggestorOpen}
          >
            <PopoverAnchor asChild>
              <textarea
                ref={textareaRef}
                value={message}
                placeholder="Build or ask anything, @ to mention schema tables"
                disabled={isWorkflowRunning}
                className={styles.input}
                rows={1}
                data-error={error ? 'true' : undefined}
                role="combobox"
                aria-controls={mentionSuggestorId}
                aria-expanded={isMentionSuggestorOpen}
                aria-autocomplete="list"
                aria-haspopup="listbox"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
              />
            </PopoverAnchor>
            <PopoverPortal>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={4}
                style={{ minWidth: textareaRef.current?.offsetWidth || 200 }}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <MentionSuggestor
                  ref={mentionSuggestorRef}
                  enabled={isMentionSuggestorOpen}
                  id={mentionSuggestorId}
                  schema={schema}
                  input={message}
                  cursorPos={cursorPos}
                  onSelect={handleMentionSelect}
                  onClose={handleClose}
                />
              </PopoverContent>
            </PopoverPortal>
          </PopoverRoot>
        </div>
        <div className={styles.actions}>
          <DeepModelingToggle
            name="isDeepModelingEnabled"
            defaultChecked={isDeepModelingEnabled}
            onChange={() => onDeepModelingToggle(!isDeepModelingEnabled)}
            disabled={isWorkflowRunning || error}
            className={styles.modeToggle}
          >
            Deep Modeling
          </DeepModelingToggle>
          <SendButton
            hasContent={hasContent}
            disabled={isWorkflowRunning || error}
            onClick={handleSubmit}
          />
        </div>
      </form>
    </div>
  )
}
