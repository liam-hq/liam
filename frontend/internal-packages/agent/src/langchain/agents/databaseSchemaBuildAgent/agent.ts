import { ChatOpenAI } from '@langchain/openai'
import { operationsSchema } from '@liam-hq/db-structure'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { ChatAgent, SchemaAwareChatVariables } from '../../utils/types'
import { buildAgentPrompt } from './prompts'

// Define the response schema
const buildAgentResponseSchema = v.object({
  message: v.string(),
  schemaChanges: operationsSchema,
})

export type BuildAgentResponse = v.InferOutput<typeof buildAgentResponseSchema>

export class DatabaseSchemaBuildAgent
  implements ChatAgent<SchemaAwareChatVariables, BuildAgentResponse>
{
  private model: ReturnType<ChatOpenAI['withStructuredOutput']>

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'o4-mini',
      callbacks: [createLangfuseHandler()],
    })

    const jsonSchema = toJsonSchema(buildAgentResponseSchema)
    this.model = baseModel.withStructuredOutput(jsonSchema)
  }

  async generate(
    variables: SchemaAwareChatVariables,
  ): Promise<BuildAgentResponse> {
    const formattedPrompt = await buildAgentPrompt.format(variables)
    const rawResponse = await this.model.invoke(formattedPrompt)

    return v.parse(buildAgentResponseSchema, rawResponse)
  }
}
