'use client'

import type { BaseMessage } from '@langchain/core/messages'
import { isAIMessage } from '@langchain/core/messages'
import type { FC } from 'react'
import { useMemo } from 'react'
import * as v from 'valibot'
import styles from './ChatHeader.module.css'
import { AgentStatusIndicator } from './components/AgentStatusIndicator'

type Props = {
  sessionTitle?: string
  messages: BaseMessage[]
  isWorkflowRunning?: boolean
}

const agentRoleSchema = v.picklist(['db', 'pm', 'qa', 'lead'])

type AgentRole = 'pm' | 'db' | 'qa'

const isValidAgentRole = (role: string): role is AgentRole => {
  return role === 'pm' || role === 'db' || role === 'qa'
}

const findLastNonLeadAgent = (aiMessages: BaseMessage[]): AgentRole | null => {
  for (let i = aiMessages.length - 1; i >= 0; i--) {
    const msg = aiMessages[i]
    if (!msg) continue

    const role = v.safeParse(agentRoleSchema, msg.name)
    if (
      role.success &&
      role.output !== 'lead' &&
      isValidAgentRole(role.output)
    ) {
      return role.output
    }
  }
  return 'pm'
}

const extractCurrentAgent = (
  messages: BaseMessage[],
  isWorkflowRunning: boolean,
): AgentRole | null => {
  if (!isWorkflowRunning) {
    return null
  }

  const aiMessages = messages.filter((msg) => isAIMessage(msg))
  if (aiMessages.length === 0) {
    return 'pm'
  }

  const lastAiMessage = aiMessages[aiMessages.length - 1]
  if (!lastAiMessage) {
    return null
  }

  const parsed = v.safeParse(agentRoleSchema, lastAiMessage.name)
  if (!parsed.success) {
    return null
  }

  if (parsed.output === 'lead') {
    return findLastNonLeadAgent(aiMessages)
  }

  return isValidAgentRole(parsed.output) ? parsed.output : null
}

const extractCompletedAgents = (messages: BaseMessage[]): AgentRole[] => {
  const completed: Set<AgentRole> = new Set()
  const aiMessages = messages.filter((msg) => isAIMessage(msg))

  for (const msg of aiMessages) {
    const parsed = v.safeParse(agentRoleSchema, msg.name)
    if (
      parsed.success &&
      parsed.output !== 'lead' &&
      isValidAgentRole(parsed.output)
    ) {
      completed.add(parsed.output)
    }
  }

  return Array.from(completed)
}

export const ChatHeader: FC<Props> = ({
  sessionTitle,
  messages,
  isWorkflowRunning = false,
}) => {
  const currentAgent = useMemo(
    () => extractCurrentAgent(messages, isWorkflowRunning),
    [messages, isWorkflowRunning],
  )

  const completedAgents = useMemo(
    () => extractCompletedAgents(messages),
    [messages],
  )

  return (
    <div className={styles.header}>
      <div className={styles.titleSection}>
        {sessionTitle && (
          <h2 className={styles.sessionTitle}>{sessionTitle}</h2>
        )}
      </div>
      {isWorkflowRunning && (
        <div className={styles.statusSection}>
          <AgentStatusIndicator
            currentAgent={currentAgent}
            completedAgents={completedAgents}
          />
        </div>
      )}
    </div>
  )
}
