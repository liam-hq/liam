import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { BasePromptVariables, ChatAgent } from '../../utils/types'
import { dmlGenerationPrompt } from './prompts'

const dmlStatementSchema = v.object({
  sql: v.string(),
  description: v.string(),
  expectedResult: v.picklist(['success', 'error']),
})

const generateDMLResponseSchema = v.object({
  statements: v.array(dmlStatementSchema),
})

type DMLStatement = v.InferOutput<typeof dmlStatementSchema>
type GenerateDMLResponse = v.InferOutput<
  typeof generateDMLResponseSchema
>

export class QADMLValidationAgent
  implements ChatAgent<BasePromptVariables, GenerateDMLResponse>
{
  private model: ReturnType<ChatOpenAI['withStructuredOutput']>

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'gpt-4o',
      callbacks: [createLangfuseHandler()],
    })

    const jsonSchema = toJsonSchema(generateDMLResponseSchema)
    this.model = baseModel.withStructuredOutput(jsonSchema)
  }

  async generate(variables: BasePromptVariables): Promise<GenerateDMLResponse> {
    const formattedPrompt = await dmlGenerationPrompt.format(variables)
    const rawResponse = await this.model.invoke(formattedPrompt)

    return v.parse(generateDMLResponseSchema, rawResponse)
  }
}
