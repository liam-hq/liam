import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ResultAsync } from 'neverthrow'
import type { WorkflowState } from '../../chat/workflow/types'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import { removeReasoningFromMessages } from '../../utils/messageCleanup'
import { saveDmlOperationsTool } from '../tools/saveDmlOperationsTool'
import { humanPromptTemplate, SYSTEM_PROMPT } from './prompt'

function formatTestCases(
  testCases: WorkflowState['generatedTestcases'],
): string {
  if (!testCases || testCases.length === 0) {
    return 'No test cases available.'
  }

  return testCases
    .map((testCase, index) => {
      const testCaseInfo = [
        `## Test Case ${index + 1}: ${testCase.title}`,
        `**ID:** ${testCase.id}`,
        `**Requirement Type:** ${testCase.requirementType}`,
        `**Category:** ${testCase.requirementCategory}`,
        `**Requirement:** ${testCase.requirement}`,
        `**Description:** ${testCase.description}`,
      ]

      return testCaseInfo.join('\n')
    })
    .join('\n\n')
}

const model = new ChatOpenAI({
  model: 'gpt-5-nano',
  useResponsesApi: true,
}).bindTools([saveDmlOperationsTool], {
  parallel_tool_calls: false,
  tool_choice: 'required',
})

export const generateDmlNode = async (
  state: WorkflowState,
): Promise<{ messages: BaseMessage[] }> => {
  const contextMessage = await humanPromptTemplate.format({
    schemaContext: convertSchemaToText(state.schemaData),
    testCasesText: formatTestCases(state.generatedTestcases),
  })

  const cleanedMessages = removeReasoningFromMessages(state.messages)

  const invokeModel = ResultAsync.fromThrowable(
    () =>
      model.invoke([
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(contextMessage),
        ...cleanedMessages,
      ]),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  const result = await invokeModel()

  if (result.isErr()) {
    throw result.error
  }

  return {
    messages: [result.value],
  }
}
