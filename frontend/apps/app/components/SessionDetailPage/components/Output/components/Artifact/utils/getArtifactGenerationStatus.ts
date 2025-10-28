import type { BaseMessage } from '@langchain/core/messages'
import { isAIMessage, isToolMessage } from '@langchain/core/messages'
import {
  extractToolCallsFromMessage,
  type ToolName,
} from '@liam-hq/agent/client'

export type ArtifactGenerationPhase =
  | 'analyzing_requirements'
  | 'generating_testcases'
  | 'generating_sql'
  | 'executing_tests'
  | 'completed'
  | null

type ArtifactGenerationStatus = {
  phase: ArtifactGenerationPhase
  isGenerating: boolean
}

const getPhaseFromToolName = (toolName: ToolName): ArtifactGenerationPhase => {
  switch (toolName) {
    case 'processAnalyzedRequirementsTool':
      return 'analyzing_requirements'
    case 'schemaDesignTool':
      return 'generating_testcases'
    case 'saveTestcase':
      return 'generating_sql'
    case 'runTestTool':
      return 'executing_tests'
    default:
      return null
  }
}

const getNextPhaseFromToolName = (
  toolName: string,
): ArtifactGenerationPhase => {
  switch (toolName) {
    case 'processAnalyzedRequirementsTool':
      return 'generating_testcases'
    case 'saveTestcase':
      return 'generating_sql'
    case 'runTestTool':
      return 'executing_tests'
    default:
      return null
  }
}

const findPhaseFromAIMessage = (
  message: BaseMessage,
): ArtifactGenerationPhase => {
  if (!isAIMessage(message)) {
    return null
  }

  const toolCalls = extractToolCallsFromMessage(message)
  if (toolCalls.length === 0) {
    return null
  }

  const lastToolCall = toolCalls[toolCalls.length - 1]
  if (!lastToolCall) {
    return null
  }

  return getPhaseFromToolName(lastToolCall.name)
}

const isValidToolName = (name: string | undefined): name is ToolName => {
  if (!name) {
    return false
  }
  const toolNames: readonly string[] = [
    'processAnalyzedRequirementsTool',
    'schemaDesignTool',
    'saveTestcase',
    'runTestTool',
  ]
  return toolNames.includes(name)
}

const findPhaseFromToolMessage = (
  message: BaseMessage,
): ArtifactGenerationPhase => {
  if (!isToolMessage(message)) {
    return null
  }

  if (!message.name) {
    return null
  }

  const nextPhase = getNextPhaseFromToolName(message.name)
  if (nextPhase) {
    return nextPhase
  }

  if (isValidToolName(message.name)) {
    return getPhaseFromToolName(message.name)
  }

  return null
}

const findLastPhaseFromMessages = (
  messages: BaseMessage[],
): ArtifactGenerationPhase => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (!message) {
      continue
    }

    const aiPhase = findPhaseFromAIMessage(message)
    if (aiPhase) {
      return aiPhase
    }

    const toolPhase = findPhaseFromToolMessage(message)
    if (toolPhase) {
      return toolPhase
    }
  }

  return 'completed'
}

export const getArtifactGenerationStatus = (
  messages: BaseMessage[],
  isStreaming: boolean,
  analyzedRequirements: unknown,
): ArtifactGenerationStatus => {
  if (!isStreaming) {
    return {
      phase: null,
      isGenerating: false,
    }
  }

  if (analyzedRequirements !== null) {
    const phase = findLastPhaseFromMessages(messages)
    return {
      phase,
      isGenerating: true,
    }
  }

  return {
    phase: 'analyzing_requirements',
    isGenerating: true,
  }
}
