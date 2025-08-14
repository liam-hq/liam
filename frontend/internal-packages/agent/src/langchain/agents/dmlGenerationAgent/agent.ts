import { type BaseMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { dmlOperationSchema } from '@liam-hq/artifact'
import { toJsonSchema } from '@valibot/to-json-schema'
import { ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import type { ChatAgent } from '../../utils/types'
import { formatDMLGenerationPrompts } from './prompts'

const DMLGenerationAgentInputSchema = v.object({
  schemaSQL: v.string(),
  formattedUseCases: v.string(),
  schemaContext: v.string(),
})

const DMLGenerationAgentOutputSchema = v.object({
  dmlOperations: v.array(dmlOperationSchema),
})

type DMLGenerationAgentInput = v.InferInput<
  typeof DMLGenerationAgentInputSchema
>
type DMLGenerationAgentOutput = v.InferOutput<
  typeof DMLGenerationAgentOutputSchema
>

export class DMLGenerationAgent
  implements ChatAgent<DMLGenerationAgentInput, DMLGenerationAgentOutput>
{
  async generate(
    input: DMLGenerationAgentInput,
  ): Promise<DMLGenerationAgentOutput> {
    const { systemMessage, humanMessage } = formatDMLGenerationPrompts({
      schema: input.schemaSQL,
      requirements: input.formattedUseCases,
      chat_history: '',
      user_message:
        'Generate comprehensive DML statements for testing the provided schema.',
    })

    const model = new ChatOpenAI({
      model: 'gpt-4.1',
    })

    const messages: BaseMessage[] = [
      new SystemMessage(systemMessage),
      new SystemMessage(humanMessage),
    ]

    const modelWithStructuredOutput = model.withStructuredOutput(
      toJsonSchema(DMLGenerationAgentOutputSchema),
      {
        name: 'dml_operations',
      },
    )

    const result = await ResultAsync.fromPromise(
      modelWithStructuredOutput.invoke(messages),
      (error: unknown) => new Error(`LLM invocation failed: ${String(error)}`),
    )

    if (result.isErr()) {
      // TODO: Implement retry logic for LLM invocation failures
      // Consider adding exponential backoff and maximum retry attempts
      // Estimated implementation: ~10 lines of code for retry loop with backoff
      console.error('Error generating structured DML operations:', result.error)
      return {
        dmlOperations: [],
      }
    }

    const parseResult = v.safeParse(
      DMLGenerationAgentOutputSchema,
      result.value,
    )

    if (!parseResult.success) {
      console.error('Error parsing DML operations result:', parseResult.issues)
      return {
        dmlOperations: [],
      }
    }

    return parseResult.output
  }
}
