import type {
  AIMessage,
  HumanMessage,
  Message,
  SystemMessage,
  ToolMessage,
} from '@langchain/langgraph-sdk'

export const aMessage = (
  type: 'human' | 'ai' | 'tool' | 'system' = 'human',
  overrides?: Partial<Message>,
): Message => {
  const baseMessage = {
    id: `msg-${Date.now()}-${Math.random()}`,
    content: 'This is a test message',
    additional_kwargs: {},
    response_metadata: {},
  }

  switch (type) {
    case 'human':
      return {
        ...baseMessage,
        type: 'human',
        example: false,
        ...overrides,
      } as HumanMessage

    case 'ai':
      return {
        ...baseMessage,
        type: 'ai',
        content: 'I can help you with that.',
        example: false,
        tool_calls: [],
        invalid_tool_calls: [],
        usage_metadata: {
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150,
        },
        ...overrides,
      } as AIMessage

    case 'tool':
      return {
        ...baseMessage,
        type: 'tool',
        content: 'Tool execution completed successfully',
        tool_call_id: 'tool-call-123',
        status: 'success',
        ...overrides,
      } as ToolMessage

    case 'system':
      return {
        ...baseMessage,
        type: 'system',
        content: 'System message',
        ...overrides,
      } as SystemMessage

    default:
      return {
        ...baseMessage,
        type: 'human',
        ...overrides,
      } as HumanMessage
  }
}
