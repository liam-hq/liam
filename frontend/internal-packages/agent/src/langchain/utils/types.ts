export type BasePromptVariables = {
  chat_history: string
  user_message: string
}

export type SchemaAwareChatVariables = BasePromptVariables & {
  schema_text: string
}

export type ChatAgent<TVariables = BasePromptVariables, TResponse = string> = {
  generate(variables: TVariables): Promise<TResponse>
}
