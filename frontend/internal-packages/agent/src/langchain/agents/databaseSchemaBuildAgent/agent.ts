import {
  AIMessage,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { tool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { operationsSchema } from '@liam-hq/db-structure'
import { toJsonSchema } from '@valibot/to-json-schema'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { getConfigurable } from '../../../chat/workflow/shared/getConfigurable'
import type { Repositories } from '../../../repositories'
import { createLangfuseHandler } from '../../utils/telemetry'
import { type DesignAgentPromptVariables, designAgentPrompt } from './prompts'

// Define the response schema
const designResponseSchema = v.object({
  message: v.string(),
  operations: operationsSchema,
})

const schemaDesignToolSchema = v.object({
  operations: operationsSchema,
})

const toolConfigurableSchema = v.object({
  buildingSchemaId: v.string(),
  latestVersionNumber: v.number(),
})

type ToolConfigurable = {
  repositories: Repositories
} & v.InferOutput<typeof toolConfigurableSchema>

const getToolConfigurable = (
  config: RunnableConfig,
): Result<ToolConfigurable, Error> => {
  if (!config.configurable) {
    return err(new Error('Missing configurable object in RunnableConfig'))
  }

  const baseConfigurableResult = getConfigurable(config)
  if (baseConfigurableResult.isErr()) {
    return err(baseConfigurableResult.error)
  }
  const { repositories } = baseConfigurableResult.value

  const parsed = v.safeParse(toolConfigurableSchema, config.configurable)
  if (!parsed.success) {
    return err(
      new Error(
        `Invalid configurable object in RunnableConfig: ${parsed.issues.map((issue) => issue.message).join(', ')}`,
      ),
    )
  }

  return ok({
    repositories,
    ...parsed.output,
  })
}

export const schemaDesignTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<string> => {
    const toolConfigurableResult = getToolConfigurable(config)
    if (toolConfigurableResult.isErr()) {
      return toolConfigurableResult.error.message
    }
    const { repositories, buildingSchemaId, latestVersionNumber } =
      toolConfigurableResult.value
    const parsed = v.parse(schemaDesignToolSchema, input)

    const result = await repositories.schema.createVersion({
      buildingSchemaId,
      latestVersionNumber,
      patch: parsed.operations,
    })

    if (!result.success) {
      return result.error ?? 'Unknown error'
    }

    return 'success'
  },
  {
    name: 'schemaDesignTool',
    description:
      'Use to design database schemas, recommend table structures, and help with database modeling.',
    // @ts-expect-error - toJsonSchema returns a JSONSchema7 object, which is not assignable to JsonSchema7Type
    schema: toJsonSchema(schemaDesignToolSchema),
  },
)

export type DesignResponse = v.InferOutput<typeof designResponseSchema>
export type InvokeResult = {
  message: AIMessage
  operations: DesignResponse['operations']
}

// const jsonSchema = toJsonSchema(designResponseSchema)
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

  return formatPrompt
    .andThen(invoke)
    .andThen((response) => ok(new AIMessage(response)))
}
