import { AIMessage, type BaseMessage } from '@langchain/core/messages'
import { v4 as uuidv4 } from 'uuid'
import type { testcaseAnnotation } from './testcaseAnnotation'

export async function executeSingleTestNode(
  _state: typeof testcaseAnnotation.State,
): Promise<{ messages: BaseMessage[] }> {
  const toolCallId = uuidv4()
  const aiMessage = new AIMessage({
    content: 'Running single test case to validate the generated testcase.',
    tool_calls: [
      {
        id: toolCallId,
        name: 'runSingleTestTool',
        args: {},
      },
    ],
  })

  return { messages: [aiMessage] }
}
