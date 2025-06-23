import { ChatOpenAI } from '@langchain/openai'
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

export class PMAgent implements ChatAgent {
  private model: ChatOpenAI

  constructor() {
    this.model = new ChatOpenAI({
      model: 'o3',
      callbacks: [createLangfuseHandler()],
    })
  }

  async generate(variables: BasePromptVariables): Promise<string> {
    // Default to analysis mode for backward compatibility
    return this.generateWithMode(variables, PMAgentMode.ANALYSIS)
  }

  async generateWithMode(
    variables: PMAgentVariables,
    mode: PMAgentMode,
  ): Promise<string> {
    const prompt =
      mode === PMAgentMode.ANALYSIS ? pmAnalysisPrompt : pmReviewPrompt

    const formattedPrompt = await prompt.format(variables)
    const response = await this.model.invoke(formattedPrompt)
    return response.content as string
  }

  // Convenience methods
  async analyzeRequirements(
    variables: BasePromptVariables,
  ): Promise<v.InferOutput<typeof requirementsAnalysisSchema>> {
    const response = await this.generateWithMode(
      variables,
      PMAgentMode.ANALYSIS,
    )
    const parsedResponse = JSON.parse(response)
    return v.parse(requirementsAnalysisSchema, parsedResponse)
  }

  async reviewDeliverables(variables: PMAgentVariables): Promise<string> {
    return this.generateWithMode(variables, PMAgentMode.REVIEW)
  }
}
