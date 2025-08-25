import type { Meta, StoryObj } from '@storybook/react'
import styles from './AgentAvatars.stories.module.css'
import { DBAgent } from './DbAgent'
import { PMAgent } from './PmAgent'
import { QAAgent } from './QaAgent'

const meta = {
  parameters: {
    layout: 'centered',
  },
} satisfies Meta

export default meta

type Story = StoryObj

export const AllAgents: Story = {
  render: () => (
    <div className={styles.agentsContainer}>
      <div className={styles.agentWrapper}>
        <PMAgent width={48} height={48} />
        <p className={styles.agentLabel}>PM Agent</p>
      </div>
      <div className={styles.agentWrapper}>
        <DBAgent width={48} height={48} />
        <p className={styles.agentLabel}>DB Agent</p>
      </div>
      <div className={styles.agentWrapper}>
        <QAAgent width={48} height={48} />
        <p className={styles.agentLabel}>QA Agent</p>
      </div>
    </div>
  ),
}

export const PMAgentSizes: Story = {
  render: () => (
    <div className={styles.sizesContainer}>
      <PMAgent width={24} height={24} />
      <PMAgent width={32} height={32} />
      <PMAgent width={48} height={48} />
      <PMAgent width={64} height={64} />
    </div>
  ),
}

export const DBAgentSizes: Story = {
  render: () => (
    <div className={styles.sizesContainer}>
      <DBAgent width={24} height={24} />
      <DBAgent width={32} height={32} />
      <DBAgent width={48} height={48} />
      <DBAgent width={64} height={64} />
    </div>
  ),
}

export const QAAgentSizes: Story = {
  render: () => (
    <div className={styles.sizesContainer}>
      <QAAgent width={24} height={24} />
      <QAAgent width={32} height={32} />
      <QAAgent width={48} height={48} />
      <QAAgent width={64} height={64} />
    </div>
  ),
}
