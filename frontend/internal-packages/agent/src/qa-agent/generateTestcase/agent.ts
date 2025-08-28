import { type BaseMessage, SystemMessage } from '@langchain/core/messages'
import type { Runnable } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { dmlOperationSchema } from '@liam-hq/artifact'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { reasoningSchema } from '../../langchain/utils/schema'
import type { Reasoning } from '../../langchain/utils/types'
import { QA_GENERATE_TESTCASE_SYSTEM_MESSAGE } from './prompts'

// Direct JsonSchema definition instead of using toJsonSchema
// because the generated schema has subtle incompatibilities with withStructuredOutput
// (specifically the properties:{}, required:[] structure).
// TODO: Migrate from valibot to zod, which is officially supported by langchain
const TESTCASE_GENERATION_SCHEMA = {
  title: 'TestcaseGeneration',
  type: 'object',
  properties: {
    testcases: {
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
  required: ['testcases'],
  additionalProperties: false,
}

// Schema for testcase from OpenAI response (without id and dmlOperations)
const testcaseFromApiSchema = v.object({
  requirementType: v.picklist(['functional', 'non_functional']), // Type of requirement
  requirementCategory: v.string(), // Category of the requirement
  requirement: v.string(), // Content/text of the specific requirement
  title: v.string(),
  description: v.string(),
})

// Complete testcase schema with id and dmlOperations (for final output)
export const testcaseSchema = v.object({
  id: v.pipe(v.string(), v.uuid()), // UUID
  requirementType: v.picklist(['functional', 'non_functional']), // Type of requirement
  requirementCategory: v.string(), // Category of the requirement
  requirement: v.string(), // Content/text of the specific requirement
  title: v.string(),
  description: v.string(),
  dmlOperations: v.array(dmlOperationSchema), // DML operations array
})

// Response schema for OpenAI structured output (without id and dmlOperations)
const testcaseGenerationFromApiSchema = v.object({
  testcases: v.array(testcaseFromApiSchema),
})

// Response schema for final output
const testcaseGenerationSchema = v.object({
  testcases: v.array(testcaseSchema),
})

export type Testcase = v.InferOutput<typeof testcaseSchema>
type TestcaseResponse = v.InferOutput<typeof testcaseGenerationSchema>

type RunInput = (BaseMessage | SystemMessage)[]

type RunOutput = TestcaseResponse

type TestcaseWithReasoning = {
  response: TestcaseResponse
  reasoning: Reasoning | null
}

export class QAGenerateTestcaseAgent {
  private testcaseModel: Runnable<
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

    this.testcaseModel = baseModel.withStructuredOutput<RunOutput>(
      TESTCASE_GENERATION_SCHEMA,
      {
        includeRaw: true,
      },
    )
  }

  async generate(messages: BaseMessage[]): Promise<TestcaseWithReasoning> {
    const allMessages = [
      new SystemMessage(QA_GENERATE_TESTCASE_SYSTEM_MESSAGE),
      ...messages,
    ]

    const { raw } = await this.testcaseModel.invoke(allMessages)
    const parsedReasoning = v.safeParse(
      reasoningSchema,
      raw.additional_kwargs['reasoning'],
    )
    const reasoning = parsedReasoning.success ? parsedReasoning.output : null

    const parsedResponse = v.parse(
      testcaseGenerationFromApiSchema,
      raw.additional_kwargs['parsed'],
    )

    const testcasesWithIds = parsedResponse.testcases.map((testcase) => ({
      ...testcase,
      id: uuidv4(),
      dmlOperations: [],
    }))

    return {
      response: { testcases: testcasesWithIds },
      reasoning,
    }
  }
}
