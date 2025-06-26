import { ChatOpenAI } from '@langchain/openai'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { ChatAgent, SchemaAwareChatVariables } from '../../utils/types'
import { qaDDLGenerationPrompt } from './prompts'

/**
 * QA DDL Generation Agent
 *
 * Uses LLM-based DDL generation for quality assurance and validation.
 * Provides intelligent DDL generation with context awareness.
 */
export class QADDLGenerationAgent
  implements ChatAgent<SchemaAwareChatVariables, string>
{
  private model: ChatOpenAI

  constructor() {
    this.model = new ChatOpenAI({
      model: 'gpt-4o',
      callbacks: [createLangfuseHandler()],
    })
  }

  async generate(variables: SchemaAwareChatVariables): Promise<string> {
    const formattedPrompt = await qaDDLGenerationPrompt.format(variables)
    const response = await this.model.invoke(formattedPrompt)
    return response.content as string
  }
}
