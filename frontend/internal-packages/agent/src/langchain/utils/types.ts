export interface BasePromptVariables {
  chat_history: string
  user_message: string
}

export interface SchemaAwareChatVariables extends BasePromptVariables {
  schema_text: string
}

export interface DMLGenerationVariables extends SchemaAwareChatVariables {
  usecases: Array<{
    requirementType: string
    requirementCategory: string
    requirement: string
    title: string
    description: string
  }>
}

export interface ChatAgent<
  TVariables = BasePromptVariables,
  TResponse = string,
> {
  generate(variables: TVariables): Promise<TResponse>
}
