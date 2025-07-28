import { type BaseMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import { QA_GENERATE_USECASE_SYSTEM_MESSAGE } from './prompts.ts'

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
const usecaseGenerationSchema = v.object({
  usecases: v.array(usecaseSchema),
})

export type Usecase = v.InferOutput<typeof usecaseSchema>
type UsecaseResponse = v.InferOutput<typeof usecaseGenerationSchema>

// @ts-ignore - Class is unused but kept for future implementation
class QAGenerateUsecaseAgent {
  private usecaseModel: ReturnType<ChatOpenAI['withStructuredOutput']>

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'o4-mini',
    })

    const usecaseJsonSchema = toJsonSchema(usecaseGenerationSchema)
    this.usecaseModel = baseModel.withStructuredOutput(usecaseJsonSchema)
  }

  async generate(messages: BaseMessage[]): Promise<UsecaseResponse> {
    const allMessages = [
      new SystemMessage(QA_GENERATE_USECASE_SYSTEM_MESSAGE),
      ...messages,
    ]

    const rawResponse = await this.usecaseModel.invoke(allMessages)
    return v.parse(usecaseGenerationSchema, rawResponse)
  }
}
