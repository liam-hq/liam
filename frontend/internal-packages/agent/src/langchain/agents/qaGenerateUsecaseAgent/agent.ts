import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { BasePromptVariables, ChatAgent } from '../../utils/types'
import { usecaseGenerationPrompt } from './prompts'

// Single usecase schema
const usecaseSchema = v.object({
  // TODO: Replace with IDs (UUID) when DB is implemented
  requirementType: v.picklist(['functional', 'non-functional']), // Type of requirement
  requirementCategory: v.string(), // Category of the requirement
  requirement: v.string(), // Content/text of the specific requirement
  title: v.string(),
  description: v.string(),
})

// Response schema for structured output
const generateUsecasesResponseSchema = v.object({
  usecases: v.array(usecaseSchema),
})

export type Usecase = v.InferOutput<typeof usecaseSchema>
type GenerateUsecasesResponse = v.InferOutput<
  typeof generateUsecasesResponseSchema
>

export class QAGenerateUsecaseAgent
  implements ChatAgent<GenerateUsecasesResponse>
{
  private model: ReturnType<ChatOpenAI['withStructuredOutput']>

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'o3',
      callbacks: [createLangfuseHandler()],
    })

    // Convert valibot schema to JSON Schema and bind to model
    const jsonSchema = toJsonSchema(generateUsecasesResponseSchema)
    this.model = baseModel.withStructuredOutput(jsonSchema)
  }

  async generate(
    variables: BasePromptVariables,
  ): Promise<GenerateUsecasesResponse> {
    const formattedPrompt = await usecaseGenerationPrompt.format(variables)
    const rawResponse = await this.model.invoke(formattedPrompt)

    return v.parse(generateUsecasesResponseSchema, rawResponse)
  }
}
