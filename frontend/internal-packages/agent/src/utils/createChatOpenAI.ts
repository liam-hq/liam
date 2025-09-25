import { ChatOpenAI, type ChatOpenAICallOptions } from '@langchain/openai'

/**
 * Create ChatOpenAI instance with automatic environment variable support
 * 
 * Reads OPENAI_API_BASE_URL environment variable if set
 * This allows easy switching between real OpenAI and mock servers
 */
export function createChatOpenAI(
  options: Partial<ChatOpenAICallOptions> & { model: string },
) {
  const baseURL = process.env.OPENAI_API_BASE_URL || process.env.OPENAI_BASE_URL

  if (baseURL) {
    console.log(`🔄 Using custom OpenAI base URL: ${baseURL}`)
    return new ChatOpenAI({
      ...options,
      configuration: {
        ...options.configuration,
        baseURL,
      },
    })
  }

  return new ChatOpenAI(options)
}