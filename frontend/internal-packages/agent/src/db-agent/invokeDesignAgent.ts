import {
  type AIMessage,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ok, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { reasoningSchema } from '../langchain/utils/schema'
import type { Reasoning } from '../langchain/utils/types'
import type { ToolConfigurable } from './getToolConfigurable'
import { type DesignAgentPromptVariables, designAgentPrompt } from './prompt'
import { schemaDesignTool } from './tools/schemaDesignTool'

const model = new ChatOpenAI({
  model: 'gpt-5',
  reasoning: { effort: 'medium', summary: 'detailed' },
  useResponsesApi: true,
}).bindTools([schemaDesignTool])

type DesignAgentResult = {
  response: AIMessage
  reasoning: Reasoning | null
}

export const invokeDesignAgent = (
  variables: DesignAgentPromptVariables,
  messages: BaseMessage[],
  configurable: ToolConfigurable,
): ResultAsync<DesignAgentResult, Error> => {
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

  return formatPrompt.andThen(invoke).andThen((response) => {
    const parsedReasoning = v.safeParse(
      reasoningSchema,
      response.additional_kwargs['reasoning'],
    )
    const reasoning = parsedReasoning.success ? parsedReasoning.output : null

    return ok({
      response,
      reasoning,
    })
  })
}
