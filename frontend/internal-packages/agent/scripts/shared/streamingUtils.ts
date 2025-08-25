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

// Helper function to process tool calls
const processToolCalls = (
  toolCalls: unknown[],
): { names: string; args: unknown[] } => {
  const processedCalls = toolCalls.map((call: unknown) => {
    if (isObject(call)) {
      const functionName =
        isObject(call['function']) && hasProperty(call['function'], 'name')
          ? call['function']['name']
          : call['name']
      const toolName = functionName || 'unknown'

      const functionArgs =
        isObject(call['function']) && hasProperty(call['function'], 'arguments')
          ? call['function']['arguments']
          : call['args']

      return { name: String(toolName), args: functionArgs }
    }
    return { name: 'unknown', args: undefined }
  })

  const names = processedCalls.map((c) => c.name).join(', ')
  const args = processedCalls.map((c) => c.args)

  return { names, args }
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
    logger.info(`Request: ${content}`)
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
    const { names, args } = processToolCalls(toolCalls)
    logger.info(`AI calling: ${names}`)
    // Log arguments for each tool call
    args.forEach((arg) => {
      if (arg !== undefined) {
        // For string arguments that look like JSON, they'll be parsed by JSON.stringify
        // For objects, they'll be properly formatted
        // This avoids the need for try-catch entirely
        logger.info(`  Arguments: ${JSON.stringify(arg, null, 2)}`)
      }
    })
  } else if (content && typeof content === 'string' && content.trim()) {
    logger.info(`AI response: ${content.trim()}`)
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
    if (isError) {
      logger.error(`${String(toolName)} ERROR: ${content}`)
    } else {
      logger.info(`${String(toolName)} SUCCESS: ${content}`)
    }
  } else {
    logger.info(`${String(toolName)}: No response`)
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
