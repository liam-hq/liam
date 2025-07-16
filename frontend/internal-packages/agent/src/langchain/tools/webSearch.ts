import type { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { ChatOpenAI } from '@langchain/openai'
import type { WebSearchConfig } from '../utils/types'

// Re-export the type for backward compatibility
export type { WebSearchConfig }

/**
 * Creates a ChatOpenAI model with optional web search capabilities
 *
 * @param baseConfig - Base configuration for the model
 * @param webSearchConfig - Configuration for web search functionality
 * @returns ChatOpenAI instance configured with web search if enabled
 *
 * @example
 * // Optional web search - model decides when to search
 * const model = createWebSearchEnabledModel(
 *   { model: 'o4-mini' },
 *   { enabled: true, searchContextSize: 'medium' }
 * )
 *
 * @example
 * // Forced web search - always uses web search
 * const model = createWebSearchEnabledModel(
 *   { model: 'o4-mini' },
 *   { enabled: true, forceUse: true }
 * )
 */
export const createWebSearchEnabledModel = (
  baseConfig: {
    model: string
    callbacks?: BaseCallbackHandler[]
  },
  webSearchConfig: WebSearchConfig = { enabled: false },
) => {
  const modelConfig: Record<string, unknown> = {
    model: baseConfig.model,
    callbacks: baseConfig.callbacks || [],
  }

  if (webSearchConfig.enabled) {
    modelConfig['tools'] = [
      {
        type: 'web_search_preview',
        web_search_preview: {
          search_context_size: webSearchConfig.searchContextSize || 'medium',
        },
      },
    ]

    if (webSearchConfig.forceUse) {
      modelConfig['tool_choice'] = { type: 'web_search_preview' }
    }
  }

  return new ChatOpenAI(modelConfig)
}
