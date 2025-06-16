import { ChatOpenAI } from '@langchain/openai'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { BasePromptVariables, ChatAgent } from '../../utils/types'
import { pmAgentReviewPrompt } from './prompts'

export class PMAgentReview implements ChatAgent {
  private model: ChatOpenAI

  constructor() {
    this.model = new ChatOpenAI({
      model: 'o3',
      callbacks: [createLangfuseHandler()],
    })
  }

  async generate(
    variables: BasePromptVariables & {
      brd_requirements?: string
      validation_results?: string
    },
  ): Promise<string> {
    const formattedPrompt = await pmAgentReviewPrompt.format(variables)
    const response = await this.model.invoke(formattedPrompt)
    return response.content as string
  }

  async *stream(
    variables: BasePromptVariables & {
      brd_requirements?: string
      validation_results?: string
    },
  ): AsyncGenerator<string> {
    const formattedPrompt = await pmAgentReviewPrompt.format(variables)
    const stream = await this.model.stream(formattedPrompt)

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string
      }
    }
  }
}
