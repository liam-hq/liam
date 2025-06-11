export interface BasePromptVariables {
  schema_text: string
  chat_history: string
  user_message: string
}

export interface ChatAgent {
  generate(variables: BasePromptVariables): Promise<string>
  stream(variables: BasePromptVariables): AsyncGenerator<string>
}

// Agent name type definition - centralized for reuse across the application
export type AgentName = 'databaseSchemaBuildAgent'
