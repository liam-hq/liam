import type { BaseMessage } from '@langchain/core/messages'
import { isAIMessage } from '@langchain/core/messages'
import { extractToolCallsFromMessage } from '@liam-hq/agent/client'
import { useMemo } from 'react'

const getAgentDisplayName = (agentRole: string | undefined): string => {
  switch (agentRole) {
    case 'pm':
      return 'PM Agent'
    case 'db':
      return 'DB Agent'
    case 'qa':
      return 'QA Agent'
    case 'lead':
      return 'Lead Agent'
    default:
      return 'Agent'
  }
}

const getStatusText = (
  agentRole: string | undefined,
  toolCalls: ReturnType<typeof extractToolCallsFromMessage>,
): string => {
  const agentName = getAgentDisplayName(agentRole)

  if (toolCalls.length > 0) {
    const toolName = toolCalls[toolCalls.length - 1]?.name
    switch (toolName) {
      case 'schemaDesignTool':
        return 'Designing database schema...'
      case 'saveTestcase':
        return 'Generating test cases...'
      case 'processAnalyzedRequirementsTool':
        return 'Analyzing requirements...'
      default:
        return `${agentName} is working...`
    }
  }

  switch (agentRole) {
    case 'pm':
      return 'Analyzing requirements...'
    case 'db':
      return 'Designing database schema...'
    case 'qa':
      return 'Generating test cases...'
    case 'lead':
      return 'Coordinating workflow...'
    default:
      return 'Processing...'
  }
}

export const useWorkflowStatus = (
  messages: BaseMessage[],
  isWorkflowRunning: boolean,
): string | undefined => {
  return useMemo(() => {
    if (!isWorkflowRunning) {
      return undefined
    }

    const lastAIMessage = [...messages]
      .reverse()
      .find((msg) => isAIMessage(msg))

    if (!lastAIMessage || !isAIMessage(lastAIMessage)) {
      return 'Processing...'
    }

    const toolCalls = extractToolCallsFromMessage(lastAIMessage)
    return getStatusText(lastAIMessage.name, toolCalls)
  }, [messages, isWorkflowRunning])
}
