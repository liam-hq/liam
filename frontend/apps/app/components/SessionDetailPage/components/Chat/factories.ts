import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'

export const aMessage = (
  type: 'human' | 'ai' | 'tool' | 'system' = 'human',
  overrides?: Partial<BaseMessage>,
): BaseMessage => {
  const baseMessage = {
    id: `msg-${Date.now()}-${Math.random()}`,
    content: 'This is a test message',
    additional_kwargs: {},
    response_metadata: {},
  }

  switch (type) {
    case 'human':
      return new HumanMessage({
        ...baseMessage,
        ...overrides,
      })

    case 'ai':
      return new AIMessage({
        ...baseMessage,
        content: 'I can help you with that.',
        tool_calls: [],
        invalid_tool_calls: [],
        usage_metadata: {
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150,
        },
        additional_kwargs: {
          tool_calls: [
            {
              id: 'call_1',
              type: 'function',
              function: {
                name: 'analyze_requirements',
                arguments: JSON.stringify({ domain: 'library_management' }),
              },
            },
          ],
        },
        ...overrides,
      })

    case 'tool':
      return new ToolMessage({
        ...baseMessage,
        content: 'Tool execution completed successfully',
        tool_call_id: 'tool-call-123',
        status: 'success',
        ...overrides,
      })

    case 'system':
      return new SystemMessage({
        ...baseMessage,
        content: 'System message',
        ...overrides,
      })

    default:
      return new HumanMessage({
        ...baseMessage,
        ...overrides,
      })
  }
}
