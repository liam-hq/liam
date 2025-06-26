import { ChatOpenAI } from '@langchain/openai'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { ChatAgent, SchemaAwareChatVariables } from '../../utils/types'
import { qaDDLGenerationPrompt } from './prompts'

/**
 * QA DDL Generation Agent
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
