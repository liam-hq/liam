import { type BaseMessage, SystemMessage } from '@langchain/core/messages'
import type { Runnable } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { dmlOperationSchema } from '@liam-hq/artifact'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { reasoningSchema } from '../../utils/schema'
import type { Reasoning } from '../../utils/types'
import { QA_GENERATE_USECASE_SYSTEM_MESSAGE } from './prompts'

// Direct JsonSchema definition instead of using toJsonSchema
// because the generated schema has subtle incompatibilities with withStructuredOutput
// (specifically the properties:{}, required:[] structure).
// TODO: Migrate from valibot to zod, which is officially supported by langchain
const USECASE_GENERATION_SCHEMA = {
  title: 'UsecaseGeneration',
  type: 'object',
  properties: {
    usecases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          requirementType: {
            type: 'string',
            enum: ['functional', 'non_functional'],
          },
          requirementCategory: { type: 'string' },
          requirement: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
        },
        required: [
          'requirementType',
          'requirementCategory',
          'requirement',
          'title',
          'description',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['usecases'],
  additionalProperties: false,
}

// Schema for usecase from OpenAI response (without id and dmlOperations)
const usecaseFromApiSchema = v.object({
  requirementType: v.picklist(['functional', 'non_functional']), // Type of requirement
  requirementCategory: v.string(), // Category of the requirement
  requirement: v.string(), // Content/text of the specific requirement
  title: v.string(),
  description: v.string(),
})

// Complete usecase schema with id and dmlOperations (for final output)
const usecaseSchema = v.object({
  id: v.pipe(v.string(), v.uuid()), // UUID
  requirementType: v.picklist(['functional', 'non_functional']), // Type of requirement
  requirementCategory: v.string(), // Category of the requirement
  requirement: v.string(), // Content/text of the specific requirement
  title: v.string(),
  description: v.string(),
  dmlOperations: v.array(dmlOperationSchema), // DML operations array
})

// Response schema for OpenAI structured output (without id and dmlOperations)
const usecaseGenerationFromApiSchema = v.object({
  usecases: v.array(usecaseFromApiSchema),
})

// Response schema for final output
const usecaseGenerationSchema = v.object({
  usecases: v.array(usecaseSchema),
})

export type Usecase = v.InferOutput<typeof usecaseSchema>
type UsecaseResponse = v.InferOutput<typeof usecaseGenerationSchema>

type RunInput = (BaseMessage | SystemMessage)[]

type RunOutput = UsecaseResponse

type UsecaseWithReasoning = {
  response: UsecaseResponse
  reasoning: Reasoning | null
}

export class QAGenerateUsecaseAgent {
  private usecaseModel: Runnable<
    RunInput,
    {
      raw: BaseMessage
      parsed: RunOutput
    }
  >

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'gpt-5-mini',
      reasoning: { effort: 'minimal' },
      useResponsesApi: true,
    })

    this.usecaseModel = baseModel.withStructuredOutput<RunOutput>(
      USECASE_GENERATION_SCHEMA,
      {
        includeRaw: true,
      },
    )
  }

  async generate(messages: BaseMessage[]): Promise<UsecaseWithReasoning> {
    const allMessages = [
      new SystemMessage(QA_GENERATE_USECASE_SYSTEM_MESSAGE),
      ...messages,
    ]

    const { raw } = await this.usecaseModel.invoke(allMessages)
    const parsedReasoning = v.safeParse(
      reasoningSchema,
      raw.additional_kwargs['reasoning'],
    )
    const reasoning = parsedReasoning.success ? parsedReasoning.output : null

    const parsedResponse = v.parse(
      usecaseGenerationFromApiSchema,
      raw.additional_kwargs['parsed'],
    )

    const usecasesWithIds = parsedResponse.usecases.map((usecase) => ({
      ...usecase,
      id: uuidv4(),
      dmlOperations: [],
    }))

    return {
      response: { usecases: usecasesWithIds },
      reasoning,
    }
  }
}
