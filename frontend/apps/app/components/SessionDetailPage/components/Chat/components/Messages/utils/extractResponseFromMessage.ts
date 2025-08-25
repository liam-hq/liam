import { parsePartialJson } from '@langchain/core/output_parsers'
import type { Message } from '@langchain/langgraph-sdk'
import { getContentString } from './getContentString'
import { isAiMessage } from './messageTypeGuards'

export function extractResponseFromMessage(message: Message): string {
  if (!isAiMessage(message)) return getContentString(message.content)

  if (
    Array.isArray(message.content) &&
    ['input_json_delta', 'tool_use'].includes(
      message.content[0]?.type as string,
    ) &&
    message.content[0] &&
    'input' in message.content[0] &&
    message.content[0].input
  ) {
    try {
      const parsedJson = parsePartialJson(message.content[0].input as string)
      if (parsedJson.response) {
        return parsedJson.response
      }
    } catch {
      // no-op
    }
  }
  const toolCall = message.tool_calls?.[0]
  const response = toolCall?.args?.response

  if (!toolCall || !response) {
    return getContentString(message.content)
  }
  return response
}
