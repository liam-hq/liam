import { type BaseMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { WEB_SEARCH_SYSTEM_MESSAGE } from './prompts'

export class WebSearchAgent {
  private searchModel: ReturnType<ChatOpenAI['bindTools']>

  constructor() {
    // Create LLM with web search tool binding
    // Note: web_search_preview is an OpenAI-specific tool type
    const webSearchTool = { type: 'web_search_preview' } as const

    this.searchModel = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.3,
    }).bindTools([webSearchTool])
  }

  async generate(messages: BaseMessage[]): Promise<string> {
    const allMessages = [
      new SystemMessage(WEB_SEARCH_SYSTEM_MESSAGE),
      ...messages,
    ]

    const result = await this.searchModel.invoke(allMessages)

    // Extract the search results content
    const searchContent =
      typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content)

    return searchContent
  }
}
