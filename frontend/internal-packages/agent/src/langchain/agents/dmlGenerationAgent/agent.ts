import * as v from 'valibot'
import type { ChatAgent } from '../../utils/types.ts'
import { formatDMLGenerationPrompts } from './prompts.ts'

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

export class DMLGenerationAgent
  implements ChatAgent<DMLGenerationAgentInput, DMLGenerationAgentOutput>
{
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
}
