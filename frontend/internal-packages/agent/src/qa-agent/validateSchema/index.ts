import { AIMessage, type BaseMessage } from '@langchain/core/messages'
import { v4 as uuidv4 } from 'uuid'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

const getTestcaseCount = (state: QaAgentState): number => {
  return Object.values(state.analyzedRequirements.testcases).reduce(
    (count, testcases) => count + testcases.length,
    0,
  )
}

export async function validateSchemaNode(
  state: QaAgentState,
): Promise<{ messages: BaseMessage[] }> {
  const toolCallId = uuidv4()
  const testcaseCount = getTestcaseCount(state)
  const aiMessage = new AIMessage({
    content: `Running ${testcaseCount} test cases to validate the database schema.`,
    name: 'qa',
    tool_calls: [
      {
        id: toolCallId,
        name: 'runTestTool',
        type: 'tool_call',
        args: {},
      },
    ],
  })

  return { messages: [aiMessage] }
}
