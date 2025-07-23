import {
  type AIMessage,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ok, ResultAsync } from 'neverthrow'
import type { ToolConfigurable } from '../../../db-agent/getToolConfigurable'
import { schemaDesignTool } from '../../../db-agent/tools/schemaDesignTool'
import { createLangfuseHandler } from '../../utils/telemetry'
import { type DesignAgentPromptVariables, designAgentPrompt } from './prompts'

const model = new ChatOpenAI({
  model: 'o4-mini',
  callbacks: [createLangfuseHandler()],
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
