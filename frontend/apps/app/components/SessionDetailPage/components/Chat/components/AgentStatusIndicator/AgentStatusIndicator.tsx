import type { FC } from 'react'
import { WorkflowRunningIndicator } from '../WorkflowRunningIndicator'
import styles from './AgentStatusIndicator.module.css'

type AgentRole = 'db' | 'pm' | 'qa' | 'lead'

type Props = {
  currentAgent: AgentRole
}

const getAgentDisplayName = (agent: AgentRole): string => {
  switch (agent) {
    case 'pm':
      return 'PM Agent'
    case 'db':
      return 'DB Agent'
    case 'qa':
      return 'QA Agent'
    case 'lead':
      return 'Lead Agent'
  }
}

export const AgentStatusIndicator: FC<Props> = ({ currentAgent }) => {
  const agentName = getAgentDisplayName(currentAgent)

  return (
    <div className={styles.container} aria-live="polite">
      <span className={styles.agentName}>{agentName} 実行中...</span>
      <WorkflowRunningIndicator size={8} />
    </div>
  )
}
