import { DatabaseSchemaAskAgent } from './agents/databaseSchemaAskAgent'
import { DatabaseSchemaBuildAgent } from './agents/databaseSchemaBuildAgent'
import type { AgentName, BasePromptVariables } from './utils/types'

const agentRegistry = {
  databaseSchemaAskAgent: new DatabaseSchemaAskAgent(),
  databaseSchemaBuildAgent: new DatabaseSchemaBuildAgent(),
} as const

export const getAgent = (agentName: AgentName) => {
  const agent = agentRegistry[agentName]
  if (!agent) {
    throw new Error(`Agent ${agentName} not found in registry`)
  }
  return agent
}

export const createPromptVariables = (
  schemaText: string,
  userMessage: string,
  chatHistory: [string, string][],
): BasePromptVariables => {
  const chatHistoryString = chatHistory
    .map(([role, message]) => `${role}: ${message}`)
    .join('\n')

  return {
    schema_text: schemaText,
    user_message: userMessage,
    chat_history: chatHistoryString || 'No previous conversation.',
  }
}

export type { AgentName }
