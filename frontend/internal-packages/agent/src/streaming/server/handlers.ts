import type { BaseMessage } from '@langchain/core/messages'
import { gray, italic } from 'yoctocolors'
import { extractReasoningFromMessage } from '../core/reasoningExtractor'
import { formatStreamingMessage } from './formatters'

export const handleReasoningMessage = (
  message: BaseMessage,
  messageId: string,
  lastReasoningContent: Map<string, string>,
): void => {
  const currentReasoningText = extractReasoningFromMessage(message) || ''
  const lastReasoningText = lastReasoningContent.get(messageId) || ''

  if (currentReasoningText && currentReasoningText !== lastReasoningText) {
    const newReasoningContent = currentReasoningText.slice(
      lastReasoningText.length,
    )
    if (newReasoningContent) {
      const name = 'name' in message && message.name ? ` (${message.name})` : ''
      const reasoningPrefix = lastReasoningText
        ? ''
        : `\n\n🧠 Thinking${name}...\n\n`
      const styledContent = gray(
        italic(`${reasoningPrefix}${newReasoningContent}`),
      )
      process.stdout.write(styledContent)
      lastReasoningContent.set(messageId, currentReasoningText)
    }
  }
}

export const handleRegularMessage = (
  message: BaseMessage,
  messageId: string,
  lastOutputContent: Map<string, string>,
): void => {
  const currentContent = message.text
  const lastContent = lastOutputContent.get(messageId) || ''

  const newContent = currentContent.slice(lastContent.length)
  if (!newContent) return

  lastOutputContent.set(messageId, currentContent)

  const formattedOutput = formatStreamingMessage(
    message,
    newContent,
    !lastContent,
  )

  process.stdout.write(formattedOutput)
}
