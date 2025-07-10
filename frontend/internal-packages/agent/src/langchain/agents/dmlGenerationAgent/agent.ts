import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { ChatAgent } from '../../utils/types'
import { dmlGenerationPrompt } from './prompts'

// Response schema for structured output
const dmlGenerationResponseSchema = v.object({
  dmlStatements: v.string(),
})

type DMLGenerationResponse = v.InferOutput<typeof dmlGenerationResponseSchema>

export interface DMLGenerationPromptVariables {
  chat_history: string
  user_message: string
  schema: string
}

export class DMLGenerationAgent
  implements ChatAgent<DMLGenerationPromptVariables, DMLGenerationResponse>
{
  private model: ReturnType<ChatOpenAI['withStructuredOutput']>

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'gpt-4o-mini',
      callbacks: [createLangfuseHandler()],
    })

    // Convert valibot schema to JSON Schema and bind to model
    const jsonSchema = toJsonSchema(dmlGenerationResponseSchema)
    this.model = baseModel.withStructuredOutput(jsonSchema)
  }

  async generate(
    variables: DMLGenerationPromptVariables,
  ): Promise<DMLGenerationResponse> {
    const formattedPrompt = await dmlGenerationPrompt.format(variables)
    const rawResponse = await this.model.invoke(formattedPrompt)

    return v.parse(dmlGenerationResponseSchema, rawResponse)
  }
}
