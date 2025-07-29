import {
  type AIMessage,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ok, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import type { ToolConfigurable } from '../../../db-agent/getToolConfigurable.ts'
import { schemaDesignTool } from '../../../db-agent/tools/schemaDesignTool.ts'
import { reasoningSchema } from '../../utils/schema.ts'
import type { Reasoning } from '../../utils/types.ts'
import {
  type DesignAgentPromptVariables,
  designAgentPrompt,
} from './prompts.ts'

const model = new ChatOpenAI({
  model: 'o4-mini',
  reasoning: { effort: 'high', summary: 'detailed' },
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
