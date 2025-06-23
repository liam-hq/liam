import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { BasePromptVariables, ChatAgent } from '../../utils/types'
import { PMAgentMode, pmAnalysisPrompt, pmReviewPrompt } from './prompts'

interface PMAgentVariables extends BasePromptVariables {
  requirements_analysis?: string
  proposed_changes?: string
}

export const requirementsAnalysisSchema = v.object({
  businessRequirement: v.string(),
  functionalRequirements: v.record(v.string(), v.array(v.string())),
  nonFunctionalRequirements: v.record(v.string(), v.array(v.string())),
})

// TODO: Add review schema
const reviewResponseSchema = v.object({
  review: v.string(),
})

type AnalysisResponse = v.InferOutput<typeof requirementsAnalysisSchema>
type ReviewResponse = v.InferOutput<typeof reviewResponseSchema>

// Union type for all possible responses
type PMAgentResponse = AnalysisResponse | ReviewResponse

export class PMAgent implements ChatAgent<PMAgentResponse> {
  private analysisModel: ReturnType<ChatOpenAI['withStructuredOutput']>
  private reviewModel: ReturnType<ChatOpenAI['withStructuredOutput']>

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'o3',
      callbacks: [createLangfuseHandler()],
    })

    // Convert valibot schemas to JSON Schema and bind to models
    const analysisJsonSchema = toJsonSchema(requirementsAnalysisSchema)
    const reviewJsonSchema = toJsonSchema(reviewResponseSchema)

    this.analysisModel = baseModel.withStructuredOutput(analysisJsonSchema)
    this.reviewModel = baseModel.withStructuredOutput(reviewJsonSchema)
  }

  async generate(variables: BasePromptVariables): Promise<PMAgentResponse> {
    // Default to analysis mode for backward compatibility
    const formattedPrompt = await pmAnalysisPrompt.format(variables)
    const rawResponse = await this.analysisModel.invoke(formattedPrompt)
    return v.parse(requirementsAnalysisSchema, rawResponse)
  }

  async generateWithMode(
    variables: PMAgentVariables,
    mode: PMAgentMode,
  ): Promise<PMAgentResponse> {
    if (mode === PMAgentMode.ANALYSIS) {
      const formattedPrompt = await pmAnalysisPrompt.format(variables)
      const rawResponse = await this.analysisModel.invoke(formattedPrompt)
      return v.parse(requirementsAnalysisSchema, rawResponse)
    }
    const formattedPrompt = await pmReviewPrompt.format(variables)
    const rawResponse = await this.reviewModel.invoke(formattedPrompt)
    return v.parse(reviewResponseSchema, rawResponse)
  }

  // Convenience methods
  async analyzeRequirements(
    variables: BasePromptVariables,
  ): Promise<v.InferOutput<typeof requirementsAnalysisSchema>> {
    const formattedPrompt = await pmAnalysisPrompt.format(variables)
    const rawResponse = await this.analysisModel.invoke(formattedPrompt)
    return v.parse(requirementsAnalysisSchema, rawResponse)
  }

  async reviewDeliverables(variables: PMAgentVariables): Promise<string> {
    const formattedPrompt = await pmReviewPrompt.format(variables)
    const rawResponse = await this.reviewModel.invoke(formattedPrompt)
    const response = v.parse(reviewResponseSchema, rawResponse)
    return response.review
  }
}
