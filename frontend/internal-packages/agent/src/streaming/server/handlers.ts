import { type BaseMessage, isAIMessage } from '@langchain/core/messages'
import { gray, italic } from 'yoctocolors'
import { extractToolCallsFromMessage } from '../core/extractToolCallsFromMessage'
import { extractReasoningFromMessage } from '../core/reasoningExtractor'
import { formatToolCallArgs } from './formatToolCallArgs'
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

export const handleToolCallMessage = (
  message: BaseMessage,
  messageId: string,
  lastToolCallsContent: Map<string, number>,
): void => {
  // Only handle AI messages that can have tool calls
  if (!isAIMessage(message)) return

  const currentToolCalls = extractToolCallsFromMessage(message)
  const lastToolCallsCount = lastToolCallsContent.get(messageId) || 0

  // Only show new tool calls
  const newToolCalls = currentToolCalls.slice(lastToolCallsCount)
  if (newToolCalls.length === 0) return

  lastToolCallsContent.set(messageId, currentToolCalls.length)

  for (const toolCall of newToolCalls) {
    const formattedArgs = formatToolCallArgs(toolCall.args)
    const argsDisplay = formattedArgs ? `(${formattedArgs})` : '()'
    const toolCallOutput = `\n\n🔧 ${toolCall.name}${argsDisplay}`
    process.stdout.write(toolCallOutput)
  }
}
