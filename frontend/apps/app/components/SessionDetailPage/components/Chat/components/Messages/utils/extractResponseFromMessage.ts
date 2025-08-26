import { type BaseMessage, isAIMessage } from '@langchain/core/messages'
import { parsePartialJson } from '@langchain/core/output_parsers'
import { getContentString } from './getContentString'

export function extractResponseFromMessage(message: BaseMessage): string {
  if (!isAIMessage(message)) return getContentString(message.content)

  if (
    Array.isArray(message.content) &&
    ['input_json_delta', 'tool_use'].includes(message.content[0]?.type ?? '') &&
    message.content[0] &&
    'input' in message.content[0] &&
    message.content[0].input
  ) {
    try {
      let json: Record<string, unknown> = {}
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      json = parsePartialJson(message.content[0].input as string) ?? {}
      if ('response' in json && typeof json['response'] === 'string') {
        return json['response']
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
