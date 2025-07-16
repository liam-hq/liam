import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import { createLangfuseHandler } from '../../utils/telemetry.ts'
import type { BasePromptVariables, ChatAgent } from '../../utils/types.ts'
import { usecaseGenerationPrompt } from './prompts.ts'

// Single usecase schema
const usecaseSchema = v.object({
  // TODO: Replace with IDs (UUID) when DB is implemented
  requirementType: v.picklist(['functional', 'non_functional']), // Type of requirement
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
  implements ChatAgent<BasePromptVariables, GenerateUsecasesResponse>
{
  private model: ReturnType<ChatOpenAI['withStructuredOutput']>

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'o4-mini',
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
