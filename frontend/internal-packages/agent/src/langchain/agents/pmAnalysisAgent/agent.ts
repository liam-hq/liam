import { tool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import * as v from 'valibot'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { BasePromptVariables, ChatAgent } from '../../utils/types'
import { pmAnalysisPrompt } from './prompts'

export const requirementsAnalysisSchema = v.object({
  businessRequirement: v.string(),
  functionalRequirements: v.record(v.string(), v.array(v.string())),
  nonFunctionalRequirements: v.record(v.string(), v.array(v.string())),
})

type AnalysisResponse = v.InferOutput<typeof requirementsAnalysisSchema>

// Create analysis tool using the schema
export const analysisTool = tool(
  async (input: unknown) => {
    // Return the analysis result as-is
    return JSON.stringify(input)
  },
  {
    name: 'analyze_requirements',
    description:
      'Analyze user requirements and categorize them into business, functional, and non-functional requirements',
    schema: {
      type: 'object',
      properties: {
        businessRequirement: {
          type: 'string',
          description: 'The main business requirement',
        },
        functionalRequirements: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' },
          },
          description: 'Functional requirements grouped by category',
        },
        nonFunctionalRequirements: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' },
          },
          description: 'Non-functional requirements grouped by category',
        },
      },
      required: [
        'businessRequirement',
        'functionalRequirements',
        'nonFunctionalRequirements',
      ],
    },
  },
)

export class PMAnalysisAgent
  implements ChatAgent<BasePromptVariables, AnalysisResponse>
{
  private baseModel: ChatOpenAI
  public analysisModel: ReturnType<ChatOpenAI['bindTools']>
  public pmAnalysisPrompt = pmAnalysisPrompt

  constructor() {
    this.baseModel = new ChatOpenAI({
      model: 'o4-mini',
      callbacks: [createLangfuseHandler()],
    })
    this.analysisModel = this.baseModel.bindTools([analysisTool], {
      tool_choice: 'any',
    })
  }

  async generate(variables: BasePromptVariables): Promise<AnalysisResponse> {
    const formattedPrompt = await pmAnalysisPrompt.format(variables)
    const rawResponse = await this.analysisModel.invoke(formattedPrompt)

    // Extract tool call arguments from the response
    const toolCall = rawResponse.tool_calls?.[0]
    if (!toolCall) {
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error('No tool call found in response')
    }

    // Parse and validate the tool call arguments
    return v.parse(requirementsAnalysisSchema, toolCall.args)
  }

  async analyzeRequirements(
    variables: BasePromptVariables,
  ): Promise<v.InferOutput<typeof requirementsAnalysisSchema>> {
    const formattedPrompt = await pmAnalysisPrompt.format(variables)
    const rawResponse = await this.analysisModel.invoke(formattedPrompt)

    // Extract tool call arguments from the response
    const toolCall = rawResponse.tool_calls?.[0]
    if (!toolCall) {
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error('No tool call found in response')
    }

    // Parse and validate the tool call arguments
    return v.parse(requirementsAnalysisSchema, toolCall.args)
  }
}
