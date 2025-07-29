import { type BaseMessage, SystemMessage } from '@langchain/core/messages'
import type { Runnable } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import * as v from 'valibot'
import { reasoningSchema } from '../../utils/schema.ts'
import type { Reasoning } from '../../utils/types.ts'
import { PM_ANALYSIS_SYSTEM_MESSAGE } from './prompts.ts'

// Direct JsonSchema definition instead of using toJsonSchema
// because the generated schema has subtle incompatibilities with withStructuredOutput
// (specifically the properties:{}, required:[] structure).
// TODO: Migrate from valibot to zod, which is officially supported by langchain
const REQUIREMENTS_ANALYSIS_SCHEMA = {
  title: 'RequirementsAnalysis',
  type: 'object',
  properties: {
    businessRequirement: { type: 'string' },
    functionalRequirements: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    nonFunctionalRequirements: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
  required: [
    'businessRequirement',
    'functionalRequirements',
    'nonFunctionalRequirements',
  ],
  additionalProperties: false,
}

const requirementsAnalysisSchema = v.strictObject({
  businessRequirement: v.string(),
  functionalRequirements: v.record(v.string(), v.array(v.string())),
  nonFunctionalRequirements: v.record(v.string(), v.array(v.string())),
})
type AnalysisResponse = v.InferOutput<typeof requirementsAnalysisSchema>

type RunInput = (BaseMessage | SystemMessage)[]

type RunOutput = AnalysisResponse

type AnalysisWithReasoning = {
  response: AnalysisResponse
  reasoning: Reasoning | null
}

export class PMAnalysisAgent {
  private analysisModel: Runnable<
    RunInput,
    {
      raw: BaseMessage
      parsed: RunOutput
    }
  >

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'o4-mini',
      reasoning: { effort: 'high', summary: 'detailed' },
      useResponsesApi: true,
    })

    this.analysisModel = baseModel.withStructuredOutput<RunOutput>(
      REQUIREMENTS_ANALYSIS_SCHEMA,
      {
        includeRaw: true,
      },
    )
  }

  async generate(messages: BaseMessage[]): Promise<AnalysisWithReasoning> {
    const allMessages: (BaseMessage | SystemMessage)[] = [
      new SystemMessage(PM_ANALYSIS_SYSTEM_MESSAGE),
      ...messages,
    ]

    const { raw } = await this.analysisModel.invoke(allMessages)

    const parsedReasoning = v.safeParse(
      reasoningSchema,
      raw.additional_kwargs['reasoning'],
    )
    const reasoning = parsedReasoning.success ? parsedReasoning.output : null

    return {
      response: v.parse(
        requirementsAnalysisSchema,
        raw.additional_kwargs['parsed'],
      ),
      reasoning,
    }
  }
}
