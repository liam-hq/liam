import { ChatOpenAI } from '@langchain/openai'
import type LangfuseCallbackHandler from 'langfuse-langchain'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { BasePromptVariables, ChatAgent } from '../../utils/types'
import { buildAgentPrompt } from './prompts'
export class DatabaseSchemaBuildAgent implements ChatAgent {
  private model: ChatOpenAI
  private langfuseHandler: LangfuseCallbackHandler

  constructor() {
    this.langfuseHandler = createLangfuseHandler()
    this.model = new ChatOpenAI({
      model: 'o3',
      callbacks: [this.langfuseHandler],
    })
  }

  async generate(variables: BasePromptVariables): Promise<string> {
    const formattedPrompt = await buildAgentPrompt.format(variables)
    const response = await this.model.invoke(formattedPrompt)

    // Explicitly call flushAsync to ensure events are sent before the Vercel function exits.
    // This helps prevent telemetry loss during job execution in Vercel environments.
    await this.langfuseHandler.flushAsync()

    return response.content as string
  }
}
