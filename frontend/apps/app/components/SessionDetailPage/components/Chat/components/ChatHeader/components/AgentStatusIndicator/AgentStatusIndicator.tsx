import type { FC } from 'react'
import { WorkflowRunningIndicator } from '../../../WorkflowRunningIndicator'
import styles from './AgentStatusIndicator.module.css'

type AgentRole = 'pm' | 'db' | 'qa'

type Props = {
  currentAgent: AgentRole | null
  completedAgents: AgentRole[]
}

const AGENT_WORKFLOW_ORDER: AgentRole[] = ['pm', 'db', 'qa']

const AGENT_LABELS: Record<AgentRole, string> = {
  pm: 'PM Agent',
  db: 'DB Agent',
  qa: 'QA Agent',
}

export const AgentStatusIndicator: FC<Props> = ({
  currentAgent,
  completedAgents,
}) => {
  const getAgentStatus = (
    agent: AgentRole,
  ): 'completed' | 'running' | 'pending' => {
    if (agent === currentAgent) return 'running'
    if (completedAgents.includes(agent)) return 'completed'
    return 'pending'
  }

  return (
    <div className={styles.container}>
      <span className={styles.label}>Status:</span>
      <div className={styles.agentList}>
        {AGENT_WORKFLOW_ORDER.map((agent, index) => {
          const status = getAgentStatus(agent)
          const isLast = index === AGENT_WORKFLOW_ORDER.length - 1

          return (
            <div key={agent} className={styles.agentItem}>
              <span
                className={styles.agentName}
                data-status={status}
                aria-label={`${AGENT_LABELS[agent]} ${status}`}
              >
                {AGENT_LABELS[agent]}
                {status === 'completed' && (
                  <span className={styles.checkmark} aria-hidden="true">
                    {' ✓'}
                  </span>
                )}
                {status === 'running' && (
                  <span className={styles.runningIndicator}>
                    <WorkflowRunningIndicator size={6} />
                  </span>
                )}
              </span>
              {!isLast && (
                <span className={styles.arrow} aria-hidden="true">
                  {' → '}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
