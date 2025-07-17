import type { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { ChatOpenAI } from '@langchain/openai'

/**
 * Web search options following OpenAI's official API
 * @see https://platform.openai.com/docs/guides/tools-web-search
 */
export type WebSearchOptions = {
  /**
   * The amount of context to include in search results
   * - 'low': Minimal context, fastest
   * - 'medium': Balanced (default)
   * - 'high': Most comprehensive, slower
   */
  search_context_size?: 'low' | 'medium' | 'high'
  /**
   * User location for geographic relevance
   */
  user_location?: {
    type: 'approximate'
    approximate: {
      /** Two-letter ISO country code */
      country?: string
      /** Free text string */
      city?: string
      /** Free text string */
      region?: string
      /** IANA timezone (optional) */
      timezone?: string
    }
  }
}

/**
 * Creates a ChatOpenAI model configured for web search
 *
 * @param baseConfig - Base configuration for the model
 * @param webSearchOptions - Configuration for web search functionality (currently unused by LangChain)
 * @param forceSearch - If true, uses gpt-4o-search-preview model; if false, uses gpt-4o-mini
 * @returns ChatOpenAI instance
 *
 * @example
 * // Use web search preview model
 * const model = createWebSearchEnabledModel(
 *   { callbacks: [] },
 *   { search_context_size: 'medium' },
 *   true
 * )
 *
 * @example
 * // Use standard model
 * const model = createWebSearchEnabledModel(
 *   { callbacks: [] },
 *   { search_context_size: 'medium' },
 *   false
 * )
 */
export const createWebSearchEnabledModel = (
  baseConfig: {
    callbacks?: BaseCallbackHandler[]
  },
  _webSearchOptions: WebSearchOptions = { search_context_size: 'medium' },
  forceSearch = true,
) => {
  // Use web search preview model when forceSearch is true
  const model = forceSearch ? 'gpt-4o-search-preview' : 'gpt-4o-mini'

  // gpt-4o-search-preview doesn't support temperature parameter
  const modelConfig = forceSearch
    ? {
        model,
        callbacks: baseConfig.callbacks || [],
      }
    : {
        model,
        callbacks: baseConfig.callbacks || [],
        temperature: 0,
      }

  return new ChatOpenAI(modelConfig)
}
