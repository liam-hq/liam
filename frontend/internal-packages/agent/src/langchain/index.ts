import { DatabaseSchemaBuildAgent } from './agents'
import type { AgentName, BasePromptVariables } from './utils/types'

// Create agent instances with error handling
const createAgentSafely = <T>(AgentClass: new () => T): T | null => {
  try {
    return new AgentClass()
  } catch (error) {
    console.error('Failed to create agent:', error)
    return null
  }
}

const databaseSchemaBuildAgent = createAgentSafely(DatabaseSchemaBuildAgent)

// Agent registry for compatibility with existing code
const agents = {
  databaseSchemaBuildAgent,
} as const

// Helper function to create prompt variables
export const createPromptVariables = (
  schemaText: string,
  userMessage: string,
  history: [string, string][] = [],
): BasePromptVariables => {
  const formattedChatHistory =
    history.length > 0
      ? history.map(([role, content]) => `${role}: ${content}`).join('\n')
      : 'No previous conversation.'

  return {
    schema_text: schemaText,
    chat_history: formattedChatHistory,
    user_message: userMessage,
  }
}

// Re-export AgentName type for external use
export type { AgentName } from './utils/types'

// Direct agent getter function with error handling
export const getAgent = (agentName: AgentName) => {
  const agent = agents[agentName]

  if (!agent) {
    throw new Error(`${agentName} not found in LangChain instance`)
  }

  return agent
}
