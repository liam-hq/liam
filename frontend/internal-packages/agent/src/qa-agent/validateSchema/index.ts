import { AIMessage, type BaseMessage } from '@langchain/core/messages'
import { v4 as uuidv4 } from 'uuid'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

export async function validateSchemaNode(
  state: QaAgentState,
): Promise<{ messages: BaseMessage[] }> {
  const toolCallId = uuidv4()
  const testcaseCount = Object.values(
    state.analyzedRequirements.testcases,
  ).flat().length
  const aiMessage = new AIMessage({
    content: `Running ${testcaseCount} test cases to validate the database schema.`,
    name: 'qa',
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
