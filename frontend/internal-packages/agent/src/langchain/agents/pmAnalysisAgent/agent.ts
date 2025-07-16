import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import { createLangfuseHandler } from '../../utils/telemetry.ts'
import type { BasePromptVariables, ChatAgent } from '../../utils/types.ts'
import { pmAnalysisPrompt } from './prompts.ts'

export const requirementsAnalysisSchema = v.object({
  businessRequirement: v.string(),
  functionalRequirements: v.record(v.string(), v.array(v.string())),
  nonFunctionalRequirements: v.record(v.string(), v.array(v.string())),
})

type AnalysisResponse = v.InferOutput<typeof requirementsAnalysisSchema>

export class PMAnalysisAgent
  implements ChatAgent<BasePromptVariables, AnalysisResponse>
{
  private analysisModel: ReturnType<ChatOpenAI['withStructuredOutput']>

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'o4-mini',
      callbacks: [createLangfuseHandler()],
    })

    // Convert valibot schema to JSON Schema and bind to model
    const analysisJsonSchema = toJsonSchema(requirementsAnalysisSchema)

    this.analysisModel = baseModel.withStructuredOutput(analysisJsonSchema)
  }

  async generate(variables: BasePromptVariables): Promise<AnalysisResponse> {
    const formattedPrompt = await pmAnalysisPrompt.format(variables)
    const rawResponse = await this.analysisModel.invoke(formattedPrompt)
    return v.parse(requirementsAnalysisSchema, rawResponse)
  }

  async analyzeRequirements(
    variables: BasePromptVariables,
  ): Promise<v.InferOutput<typeof requirementsAnalysisSchema>> {
    const formattedPrompt = await pmAnalysisPrompt.format(variables)
    const rawResponse = await this.analysisModel.invoke(formattedPrompt)
    return v.parse(requirementsAnalysisSchema, rawResponse)
  }
}
