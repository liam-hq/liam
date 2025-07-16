export type BasePromptVariables = {
  chat_history: string
  user_message: string
}

export type ChatAgent<TVariables = BasePromptVariables, TResponse = string> = {
  generate(variables: TVariables): Promise<TResponse>
}

/**
 * Configuration for web search functionality
 */
export type WebSearchConfig = {
  /**
   * Whether web search is enabled
   */
  enabled?: boolean
  /**
   * The amount of context to include in search results
   * - 'low': Minimal context
   * - 'medium': Standard context (default)
   * - 'high': Extended context
   */
  searchContextSize?: 'low' | 'medium' | 'high'
  /**
   * When true, forces the model to use web search for every request
   * by adding tool_choice parameter to the model configuration.
   * This ensures web search is always invoked rather than being optional.
   */
  forceUse?: boolean
}
