import { ChatOpenAI } from '@langchain/openai'

export type WebSearchConfig = {
  enabled?: boolean
  searchContextSize?: 'low' | 'medium' | 'high'
}

export const createWebSearchEnabledModel = (
  baseConfig: {
    model: string
    callbacks?: any[]
  },
  webSearchConfig: WebSearchConfig = { enabled: false },
) => {
  const baseModel = new ChatOpenAI({
    model: baseConfig.model,
    callbacks: baseConfig.callbacks || [],
  })

  if (!webSearchConfig.enabled) {
    return baseModel
  }

  return baseModel
}
