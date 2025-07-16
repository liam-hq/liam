import type { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { ChatOpenAI } from '@langchain/openai'

export type WebSearchConfig = {
  enabled?: boolean
  searchContextSize?: 'low' | 'medium' | 'high'
}

export const createWebSearchEnabledModel = (
  baseConfig: {
    model: string
    callbacks?: BaseCallbackHandler[]
  },
  webSearchConfig: WebSearchConfig = { enabled: false },
) => {
  const modelConfig = {
    model: baseConfig.model,
    callbacks: baseConfig.callbacks || [],
    ...(webSearchConfig.enabled && {
      tools: [
        {
          type: 'web_search_preview' as const,
          web_search_preview: {
            search_context_size: webSearchConfig.searchContextSize || 'medium',
          },
        },
      ],
    }),
  }

  return new ChatOpenAI(modelConfig)
}
