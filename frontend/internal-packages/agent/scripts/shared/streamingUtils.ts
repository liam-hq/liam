import { gray } from 'yoctocolors'
import { isMessageContentError } from '../../src/chat/workflow/utils/toolMessageUtils'
import { hasProperty, isObject } from './scriptUtils'
import type { Logger } from './types'

// Helper function to extract message type
const getMessageType = (lastMessage: unknown): string => {
  let rawMessageType = 'Unknown'

  if (isObject(lastMessage)) {
    if (Array.isArray(lastMessage['lc']) && lastMessage['lc'].length > 2) {
      rawMessageType = String(lastMessage['lc'][2])
    } else if (
      hasProperty(lastMessage, '_getType') &&
      typeof lastMessage['_getType'] === 'function'
    ) {
      rawMessageType = String(lastMessage['_getType']())
    } else if (
      isObject(lastMessage['constructor']) &&
      hasProperty(lastMessage['constructor'], 'name')
    ) {
      rawMessageType = String(lastMessage['constructor']['name'])
    }
  }

  return rawMessageType.toLowerCase().replace('message', '')
}

// Helper function to summarize tool arguments
const getArgumentSummary = (
  args: unknown,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
): string => {
  // Pure type-based handling - no special cases for any tools

  if (typeof args === 'string') {
    return args.length > 50 ? `${args.slice(0, 47)}...` : args
  }

  if (Array.isArray(args)) {
    return `${args.length} items`
  }

  if (isObject(args)) {
    const keys = Object.keys(args)

    // Single property
    if (keys.length === 1) {
      const key = keys[0]
      if (!key) return '?'
      const value = args[key]

      // Array value
      if (Array.isArray(value)) {
        return `${key}: ${value.length} items`
      }

      // String value
      if (typeof value === 'string') {
        if (value.length <= 30) return `${key}: ${value}`
        return `${key}: ${value.slice(0, 27)}...`
      }

      // Boolean/number value
      if (typeof value === 'boolean' || typeof value === 'number') {
        return `${key}: ${value}`
      }

      // Object value
      if (isObject(value)) {
        return `${key}: {...}`
      }

      // Null/undefined
      if (value === null) return `${key}: null`
      if (value === undefined) return `${key}: undefined`

      return `${key}: ?`
    }

    // Multiple properties
    if (keys.length <= 3) {
      return keys.join(', ')
    }

    return `${keys.length} params`
  }

  // Primitive types
  if (typeof args === 'boolean') return String(args)
  if (typeof args === 'number') return String(args)
  if (args === null) return 'null'
  if (args === undefined) return 'undefined'

  return ''
}

// Helper function to process tool calls
const processToolCalls = (
  toolCalls: unknown[],
): { tools: Array<{ name: string; summary: string }> } => {
  const tools = toolCalls.map((call: unknown) => {
    if (isObject(call)) {
      const functionName =
        isObject(call['function']) && hasProperty(call['function'], 'name')
          ? call['function']['name']
          : call['name']
      const toolName = String(functionName || 'unknown')

      const functionArgs =
        isObject(call['function']) && hasProperty(call['function'], 'arguments')
          ? call['function']['arguments']
          : call['args']

      const summary = getArgumentSummary(functionArgs)
      return { name: toolName, summary }
    }
    return { name: 'unknown', summary: '' }
  })

  return { tools }
}

// Helper function to extract content from message
const getMessageContent = (lastMessage: unknown): string | undefined => {
  if (!isObject(lastMessage)) return undefined

  const content =
    lastMessage['content'] ||
    (isObject(lastMessage['kwargs']) &&
    hasProperty(lastMessage['kwargs'], 'content')
      ? lastMessage['kwargs']['content']
      : undefined)

  // Handle both string and array formats
  if (typeof content === 'string') {
    return content
  }

  // Handle array format (e.g., [{ type: 'text', text: '...', annotations: [] }])
  if (Array.isArray(content) && content.length > 0) {
    const firstItem = content[0]
    if (isObject(firstItem) && hasProperty(firstItem, 'text')) {
      return typeof firstItem['text'] === 'string'
        ? firstItem['text']
        : undefined
    }
  }

  return undefined
}

// Helper function to extract tool calls from AI message
const getToolCalls = (lastMessage: unknown): unknown[] => {
  const kwargsToolCalls =
    isObject(lastMessage) &&
    isObject(lastMessage['kwargs']) &&
    hasProperty(lastMessage['kwargs'], 'additional_kwargs') &&
    isObject(lastMessage['kwargs']['additional_kwargs']) &&
    hasProperty(lastMessage['kwargs']['additional_kwargs'], 'tool_calls')
      ? lastMessage['kwargs']['additional_kwargs']['tool_calls']
      : undefined

  const toolCalls =
    (isObject(lastMessage) ? lastMessage['tool_calls'] : undefined) ||
    kwargsToolCalls ||
    []

  return Array.isArray(toolCalls) ? toolCalls : []
}

// Helper function to get tool name from message
const getToolName = (lastMessage: unknown): string => {
  if (!isObject(lastMessage)) return 'unknown'

  const name =
    lastMessage['name'] ||
    (isObject(lastMessage['kwargs']) &&
    hasProperty(lastMessage['kwargs'], 'name')
      ? lastMessage['kwargs']['name']
      : undefined) ||
    'unknown'

  return typeof name === 'string' ? name : 'unknown'
}

// Helper function to log human message
const logHumanMessage = (logger: Logger, content: string | undefined) => {
  if (content && typeof content === 'string') {
    // Split content into lines and apply gray to each line
    const lines = content.split('\n')
    const grayLines = lines.map((line, index) => {
      // Add ">" prefix only to the first line
      const prefix = index === 0 ? '> ' : '  '
      return gray(`${prefix}${line}`)
    })
    logger.info(grayLines.join('\n'))
  }
}

// Helper function to log AI message
const logAIMessage = (
  logger: Logger,
  content: string | undefined,
  lastMessage: unknown,
) => {
  const toolCalls = getToolCalls(lastMessage)
  const hasToolCalls = Array.isArray(toolCalls) && toolCalls.length > 0

  if (hasToolCalls) {
    const { tools } = processToolCalls(toolCalls)
    // Log each tool call in Claude Code format
    tools.forEach((tool) => {
      const argsSummary = tool.summary ? `(${tool.summary})` : ''
      logger.info(`⏺ ${tool.name}${argsSummary}`)
    })
  } else if (content && typeof content === 'string' && content.trim()) {
    logger.info(`⏺ ${content.trim()}`)
  }
}

// Helper function to log tool message
const logToolMessage = (
  logger: Logger,
  content: string | undefined,
  lastMessage: unknown,
) => {
  const toolName = getToolName(lastMessage)

  if (content && typeof content === 'string') {
    const isError = isMessageContentError(content)

    // Clean up the message by removing redundant prefixes
    const cleanMessage = content
      .replace(/^[A-Za-z]+\s+(SUCCESS|ERROR):\s*/i, '') // Remove "toolName SUCCESS:" or "toolName ERROR:"
      .replace(/^(Successfully|Error)\s+/i, '') // Remove "Successfully" or "Error" at the start
      .trim()

    // For multi-line content, format with proper indentation
    const lines = cleanMessage.split('\n')
    const formattedMessage =
      lines.length > 1
        ? lines
            .map((line, index) => (index === 0 ? line : `    ${line}`))
            .join('\n')
        : cleanMessage

    if (isError) {
      logger.error(`  ⎿ ❌ ${formattedMessage}`)
    } else {
      logger.info(`  ⎿ ${formattedMessage}`)
    }
  } else {
    logger.info(`  ⎿ No response from ${String(toolName)}`)
  }
}

// Helper function to log message content
const logMessageContent = (
  logger: Logger,
  messageType: string,
  lastMessage: unknown,
) => {
  if (!isObject(lastMessage)) return

  const content = getMessageContent(lastMessage)

  if (messageType === 'human') {
    logHumanMessage(logger, content)
  } else if (messageType === 'ai') {
    logAIMessage(logger, content, lastMessage)
  } else if (messageType === 'tool') {
    logToolMessage(logger, content, lastMessage)
  }
}

// Helper function to process stream chunk
export const processStreamChunk = (logger: Logger, chunk: unknown) => {
  if (!isObject(chunk) || !Array.isArray(chunk['messages'])) {
    return
  }

  const messages = chunk['messages']
  if (messages.length === 0) {
    return
  }

  const lastMessage = messages[messages.length - 1]

  const messageType = getMessageType(lastMessage)

  // Debug: log full message structure
  if (isObject(lastMessage)) {
    const kwargsAdditional =
      isObject(lastMessage['kwargs']) &&
      hasProperty(lastMessage['kwargs'], 'additional_kwargs')
        ? lastMessage['kwargs']['additional_kwargs']
        : undefined

    logger.debug('Full Message:', {
      messageType,
      content: lastMessage['content'],
      toolCalls: lastMessage['tool_calls'],
      additionalKwargs: kwargsAdditional,
    })
  }

  // Log essential information
  logMessageContent(logger, messageType, lastMessage)
}
