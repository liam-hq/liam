import {
  type AIMessage,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ok, ResultAsync } from 'neverthrow'
import type { ToolConfigurable } from '../../../db-agent/getToolConfigurable.ts'
import { schemaDesignTool } from '../../../db-agent/tools/schemaDesignTool.ts'
import {
  type DesignAgentPromptVariables,
  designAgentPrompt,
} from './prompts.ts'

const model = new ChatOpenAI({
  model: 'o4-mini',
}).bindTools([schemaDesignTool])

export const invokeDesignAgent = (
  variables: DesignAgentPromptVariables,
  messages: BaseMessage[],
  configurable: ToolConfigurable,
): ResultAsync<AIMessage, Error> => {
  const formatPrompt = ResultAsync.fromSafePromise(
    designAgentPrompt.format(variables),
  )
  const invoke = ResultAsync.fromThrowable(
    (systemPrompt: string) =>
      model.invoke([new SystemMessage(systemPrompt), ...messages], {
        configurable,
      }),
    (error) => new Error(`Failed to invoke design agent: ${error}`),
  )

  return formatPrompt.andThen(invoke).andThen((response) => ok(response))
}
