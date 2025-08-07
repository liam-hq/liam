import { type BaseMessage, SystemMessage } from '@langchain/core/messages'
import type { Runnable } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { dmlOperationSchema } from '@liam-hq/artifact'
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
          id: {
            type: 'string',
            description: 'UUID v4 format',
          },
          requirementType: {
            type: 'string',
            enum: ['functional', 'non_functional'],
          },
          requirementCategory: { type: 'string' },
          requirement: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          dmlOperations: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                useCaseId: { type: 'string' },
                operation_type: {
                  type: 'string',
                  enum: ['INSERT', 'UPDATE', 'DELETE', 'SELECT'],
                },
                sql: { type: 'string' },
                description: { type: 'string' },
                dml_execution_logs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      executed_at: { type: 'string' },
                      success: { type: 'boolean' },
                      result_summary: { type: 'string' },
                    },
                    required: ['executed_at', 'success', 'result_summary'],
                  },
                },
              },
              required: [
                'useCaseId',
                'operation_type',
                'sql',
                'description',
                'dml_execution_logs',
              ],
            },
            description: 'Array of DML operations',
          },
        },
        required: [
          'id',
          'requirementType',
          'requirementCategory',
          'requirement',
          'title',
          'description',
          'dmlOperations',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['usecases'],
  additionalProperties: false,
}

// Complete usecase schema with id and dmlOperations
const usecaseSchema = v.object({
  id: v.pipe(v.string(), v.uuid()), // UUID
  requirementType: v.picklist(['functional', 'non_functional']), // Type of requirement
  requirementCategory: v.string(), // Category of the requirement
  requirement: v.string(), // Content/text of the specific requirement
  title: v.string(),
  description: v.string(),
  dmlOperations: v.array(dmlOperationSchema), // DML operations array
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
      model: 'o4-mini',
      reasoning: { effort: 'high', summary: 'detailed' },
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
      usecaseGenerationSchema,
      raw.additional_kwargs['parsed'],
    )

    return {
      response: parsedResponse,
      reasoning,
    }
  }
}
