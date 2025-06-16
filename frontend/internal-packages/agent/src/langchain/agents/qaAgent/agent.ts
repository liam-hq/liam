import { ChatOpenAI } from '@langchain/openai'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { BasePromptVariables, ChatAgent } from '../../utils/types'
import { qaAgentPrompt } from './prompts'

export class QAAgent implements ChatAgent {
  private model: ChatOpenAI

  constructor() {
    this.model = new ChatOpenAI({
      model: 'o3',
      callbacks: [createLangfuseHandler()],
    })
  }

  async generate(
    variables: BasePromptVariables & { brd_requirements?: string },
  ): Promise<string> {
    const formattedPrompt = await qaAgentPrompt.format(variables)
    const response = await this.model.invoke(formattedPrompt)
    return response.content as string
  }

  async *stream(
    variables: BasePromptVariables & { brd_requirements?: string },
  ): AsyncGenerator<string> {
    const formattedPrompt = await qaAgentPrompt.format(variables)
    const stream = await this.model.stream(formattedPrompt)

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string
      }
    }
  }
}
