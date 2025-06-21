export interface BasePromptVariables {
  schema_text: string
  chat_history: string
  user_message: string
}

export interface ChatAgent<T = string> {
  generate(variables: BasePromptVariables): Promise<T>
}
