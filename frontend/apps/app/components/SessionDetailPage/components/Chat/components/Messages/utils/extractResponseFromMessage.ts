import { type BaseMessage, isAIMessage } from '@langchain/core/messages'
import { parsePartialJson } from '@langchain/core/output_parsers'
import { getContentString } from './getContentString'

// Helper function to extract response from content block
function extractResponseFromBlock(block: unknown): string | null {
  if (
    !block ||
    typeof block !== 'object' ||
    !('type' in block) ||
    !('input' in block)
  ) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const blockWithType = block as { type?: string; input?: unknown }

  if (
    !['input_json_delta', 'tool_use'].includes(blockWithType.type ?? '') ||
    !blockWithType.input
  ) {
    return null
  }

  try {
    // If input is already an object, use it directly
    let parsedInput: unknown = blockWithType.input

    // If input is a string, try to parse it
    if (typeof blockWithType.input === 'string') {
      parsedInput = parsePartialJson(blockWithType.input)
    }

    // Check for response field
    if (
      parsedInput &&
      typeof parsedInput === 'object' &&
      'response' in parsedInput
    ) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const parsed = parsedInput as { response: unknown }
      if (typeof parsed.response === 'string') {
        return parsed.response
      }
    }
  } catch {
    // Return null if parsing fails
  }

  return null
}

// Helper function to extract response from content array
function extractResponseFromContentArray(content: unknown[]): string | null {
  for (const block of content) {
    const response = extractResponseFromBlock(block)
    if (response !== null) {
      return response
    }
  }
  return null
}

// Helper function to process raw response
function processRawResponse(rawResponse: unknown): string {
  // Parse JSON string if needed
  let response = rawResponse
  if (typeof rawResponse === 'string') {
    try {
      response = JSON.parse(rawResponse)
    } catch {
      // Keep as string if parse fails
      response = rawResponse
    }
  }

  // Extract content from response object
  if (response && typeof response === 'object' && 'content' in response) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const responseObj = response as { content: unknown }
    return extractContentFromResponseObject(responseObj.content)
  }

  // Convert to string
  if (typeof response === 'string') {
    return response
  }

  if (response && typeof response === 'object') {
    return JSON.stringify(response)
  }

  return ''
}

// Helper function to extract content from response object
function extractContentFromResponseObject(content: unknown): string {
  if (typeof content === 'string') {
    return getContentString(content)
  }

  if (Array.isArray(content)) {
    return getContentString(content)
  }

  if (content !== null && content !== undefined) {
    return String(content)
  }

  return ''
}

export function extractResponseFromMessage(message: BaseMessage): string {
  if (!isAIMessage(message)) return getContentString(message.content)

  // Iterate through all content entries to find response
  if (Array.isArray(message.content)) {
    const response = extractResponseFromContentArray(message.content)
    if (response !== null) {
      return response
    }
  }
  const toolCall = message.tool_calls?.[0]
  const rawResponse = toolCall?.args?.response

  if (!toolCall || rawResponse === undefined) {
    return getContentString(message.content)
  }

  // Process the raw response
  return processRawResponse(rawResponse)
}
