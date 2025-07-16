import type { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import {
  createWebSearchEnabledModel,
  type WebSearchConfig,
} from '../../tools/webSearch'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { BasePromptVariables, ChatAgent } from '../../utils/types'
import { pmAnalysisPrompt } from './prompts'

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

  constructor(webSearchConfig?: WebSearchConfig) {
    const baseModel = createWebSearchEnabledModel(
      {
        model: 'o4-mini',
        callbacks: [createLangfuseHandler()],
      },
      webSearchConfig,
    )

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
