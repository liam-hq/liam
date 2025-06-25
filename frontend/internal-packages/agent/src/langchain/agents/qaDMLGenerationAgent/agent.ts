import { ChatOpenAI } from '@langchain/openai'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { ChatAgent } from '../../utils/types'
import { qaDMLGenerationPrompt } from './prompts'

export interface DMLGenerationVariables {
  schema_text: string
  use_cases: string
  chat_history: string
  user_message: string
}

/**
 * QA DML Generation Agent
 * Generates INSERT statements for testing based on schema and use cases
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
