export interface BasePromptVariables {
  schema_text: string
  chat_history: string
  user_message: string
}

export interface ChatAgent {
  generate(variables: BasePromptVariables): Promise<string>
  stream(variables: BasePromptVariables): AsyncGenerator<string>
}
