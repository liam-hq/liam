import type * as React from 'react'
import type { FormEvent } from 'react'
import type { MentionCandidate } from '../Chat/MentionSuggestor/types'
import type { InputProps } from './types'

// Handle regular text input keys
export const handleRegularTextInput = (
  e: React.KeyboardEvent<HTMLTextAreaElement>,
): boolean => {
  // Allow normal character input (especially after @ for mentions)
  if (/^[a-zA-Z0-9-_]$/.test(e.key)) {
    return true
  }
  return false
}

// Handle keyboard events when mention suggestions are visible
export const handleMentionKeyboardEvents = (
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  inputPropsRef: React.MutableRefObject<InputProps>,
): boolean => {
  // Pass keyboard events to mention suggestor if available
  const onKeyDown = inputPropsRef.current?.onKeyDown
  if (onKeyDown) {
    try {
      // Cast the event type for compatibility
      onKeyDown(e as unknown as React.KeyboardEvent<HTMLInputElement>)
    } catch (error) {
      // Prevent errors from breaking the UI
      console.error('Error in mention keyboard handler:', error)
    }
  }

  // Prevent cursor movement with arrow keys during suggestion navigation
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    return true
  }

  // Prevent form submission when Enter is pressed with an active suggestion
  if (e.key === 'Enter' && document.querySelector('[aria-selected="true"]')) {
    e.preventDefault()
    return true
  }

  return false
}

// Handle keyboard events when no mention suggestions are visible
export const handleNormalKeyboardEvents = (
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  isImeComposing: boolean,
  hasContent: boolean,
  handleSubmit: (e: FormEvent) => void,
): boolean => {
  // Ignore Enter key during or immediately after IME composition
  if (e.nativeEvent.isComposing || isImeComposing) {
    return false
  }

  // Handle Enter key for form submission
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault() // Prevent default newline behavior
    if (hasContent) {
      handleSubmit(e) // Submit the form
    }
    return true
  }
  return false
}

// Handle mention suggestion selection
export const handleMentionSelect = (
  item: MentionCandidate,
  message: string,
  mentionCaret: number,
  trigger = '@',
): string => {
  const caret = mentionCaret
  const before = message.slice(0, caret)
  const match = new RegExp(`\\${trigger}([\\w-]*)$`).exec(before)
  if (!match) return message

  const start = caret - match[0].length
  const after = message.slice(caret)

  // Use the same processing for all types (label already contains all necessary information)
  return `${message.slice(0, start)}${trigger}${item.label} ${after}`
}
