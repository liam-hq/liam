import { ChatOpenAI } from '@langchain/openai'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { ChatAgent, DMLGenerationVariables } from '../../utils/types'
import { qaDMLGenerationPrompt } from './prompts'

/**
 * QA DML Generation Agent
 *
 * Generates realistic test data using PostgreSQL DML statements
 * based on schema information and use cases for testing purposes.
 */
export class QADMLGenerationAgent
  implements ChatAgent<DMLGenerationVariables, string>
{
  private model: ChatOpenAI

  constructor() {
    this.model = new ChatOpenAI({
      model: 'gpt-4o',
      callbacks: [createLangfuseHandler()],
    })
  }

  async generate(variables: DMLGenerationVariables): Promise<string> {
    const formattedPrompt = await qaDMLGenerationPrompt.format(variables)
    const response = await this.model.invoke(formattedPrompt)
    return response.content as string
  }
}
