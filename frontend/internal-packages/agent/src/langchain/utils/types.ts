export type BasePromptVariables = {
  chat_history: string
  user_message: string
}

export type ChatAgent<TVariables = BasePromptVariables, TResponse = string> = {
  generate(variables: TVariables): Promise<TResponse>
}

export type WebSearchConfig = {
  enabled?: boolean
  searchContextSize?: 'low' | 'medium' | 'high'
}
