import { AIMessage, type BaseMessage } from '@langchain/core/messages'
import { v4 as uuidv4 } from 'uuid'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

export async function validateSchemaNode(
  state: QaAgentState,
): Promise<{ messages: BaseMessage[] }> {
  const toolCallId = uuidv4()
  const aiMessage = new AIMessage({
    content: `Running ${state.testcases.length} test cases to validate the database schema.`,
    tool_calls: [
      {
        id: toolCallId,
        name: 'runTestTool',
        args: {},
      },
    ],
  })

  return { messages: [aiMessage] }
}
