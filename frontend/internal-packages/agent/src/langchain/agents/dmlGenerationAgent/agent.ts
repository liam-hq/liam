import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import { type Result, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { ChatAgent } from '../../utils/types'
import type { Usecase } from '../qaGenerateUsecaseAgent/agent'
import { formatDMLGenerationPrompts } from './prompts'

const DMLGenerationAgentInputSchema = v.object({
  schemaSQL: v.string(),
  formattedUseCases: v.string(),
  schemaContext: v.string(),
})

const DMLGenerationAgentOutputSchema = v.object({
  dmlStatements: v.string(),
})

type DMLGenerationAgentInput = v.InferInput<
  typeof DMLGenerationAgentInputSchema
>
type DMLGenerationAgentOutput = v.InferOutput<
  typeof DMLGenerationAgentOutputSchema
>

// Schema for individual DML operation
const dmlOperationSchema = v.object({
  sql: v.string(),
  operationType: v.picklist(['INSERT', 'UPDATE', 'DELETE', 'SELECT']),
  purpose: v.string(),
  expectedOutcome: v.string(),
  order: v.number(),
})

export type DMLOperation = v.InferOutput<typeof dmlOperationSchema>

// Schema for generateDMLForUsecase response - must be an object for OpenAI structured output
const generateDMLForUsecaseResponseSchema = v.object({
  operations: v.array(dmlOperationSchema),
})

// Input schema for generateDMLForUsecase - Not used in current implementation

type GenerateDMLForUsecaseInput = {
  usecase: Usecase
  ddlStatements: string
  schemaContext: string
  previousError?: string
}

export class DMLGenerationAgent
  implements ChatAgent<DMLGenerationAgentInput, DMLGenerationAgentOutput>
{
  private model: ReturnType<ChatOpenAI['withStructuredOutput']>

  constructor() {
    const baseModel = new ChatOpenAI({
      model: 'o4-mini',
      callbacks: [createLangfuseHandler()],
    })

    // Convert valibot schema to JSON Schema and bind to model
    const jsonSchema = toJsonSchema(generateDMLForUsecaseResponseSchema)
    this.model = baseModel.withStructuredOutput(jsonSchema)
  }

  async generate(
    input: DMLGenerationAgentInput,
  ): Promise<DMLGenerationAgentOutput> {
    formatDMLGenerationPrompts({
      schema: input.schemaSQL,
      requirements: input.formattedUseCases,
      chat_history: '',
      user_message:
        'Generate comprehensive DML statements for testing the provided schema.',
    })

    // TODO: Integrate with LLM using systemMessage and humanMessage

    return {
      dmlStatements: '-- DML statements will be generated here',
    }
  }

  async generateDMLForUsecase(
    input: GenerateDMLForUsecaseInput,
  ): Promise<Result<DMLOperation[], Error>> {
    const { usecase, ddlStatements, schemaContext, previousError } = input

    // Prepare the prompt for LLM
    const prompt = `
Given the following database schema and use case, generate multiple DML operations for testing.

Schema:
${ddlStatements}

Schema Context:
${schemaContext}

Use Case:
- Title: ${usecase.title}
- Description: ${usecase.description}
- Requirement Type: ${usecase.requirementType}
- Requirement Category: ${usecase.requirementCategory}
- Requirement: ${usecase.requirement}

${
  previousError
    ? `IMPORTANT: A previous attempt to generate DML for this use case failed with the following error:
${previousError}

Please ensure your response addresses this error. The error indicates that the response format must be a JSON object (not an array). Make sure to return an object that contains an array of operations, not a raw array.`
    : ''
}

Generate a JSON object with an "operations" field containing an array of DML operations. Each operation in the array should have:
1. sql: The SQL statement
2. operationType: One of INSERT, UPDATE, DELETE, SELECT
3. purpose: Why this operation is needed for testing this use case
4. expectedOutcome: What should happen when this operation runs
5. order: Execution order (starting from 1)

Example structure:
{
  "operations": [
    {
      "sql": "INSERT INTO ...",
      "operationType": "INSERT",
      "purpose": "...",
      "expectedOutcome": "...",
      "order": 1
    },
    ...
  ]
}

IMPORTANT:
- Generate operations in the correct execution order (e.g., INSERTs before SELECTs)
- Include test data setup (INSERTs)
- Include validation queries (SELECTs)
- For non-functional requirements (like performance), generate bulk operations
- Ensure all SQL references tables that exist in the schema
- The response must be a valid JSON that matches the expected schema structure
`

    // Invoke the model and handle errors with Result type
    return ResultAsync.fromPromise(this.model.invoke(prompt), (error) =>
      error instanceof Error
        ? error
        : new Error('Unknown error during model invocation'),
    ).andThen(
      (rawResponse) =>
        ResultAsync.fromPromise(
          Promise.resolve(
            v.parse(generateDMLForUsecaseResponseSchema, rawResponse),
          ),
          (error) =>
            error instanceof Error
              ? error
              : new Error('Failed to parse model response'),
        ).map((parsedResponse) => parsedResponse.operations), // Extract the operations array from the wrapper object
    )
  }
}
