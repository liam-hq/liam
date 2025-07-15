import type { Meta, StoryObj } from '@storybook/react'
import { BuildAgent } from './BuildAgent'
import { DBAgent } from './DbAgent'
import { PMAgent } from './PmAgent'
import { QAAgent } from './QaAgent'

const meta = {
  title: 'Components/AgentAvatars',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta

export default meta

type Story = StoryObj

export const AllAgents: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <BuildAgent width={48} height={48} />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>Build Agent</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <PMAgent width={48} height={48} />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>PM Agent</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <DBAgent width={48} height={48} />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>DB Agent</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <QAAgent width={48} height={48} />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>QA Agent</p>
      </div>
    </div>
  ),
}

export const BuildAgentSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <BuildAgent width={24} height={24} />
      <BuildAgent width={32} height={32} />
      <BuildAgent width={48} height={48} />
      <BuildAgent width={64} height={64} />
    </div>
  ),
}

export const PMAgentSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <PMAgent width={24} height={24} />
      <PMAgent width={32} height={32} />
      <PMAgent width={48} height={48} />
      <PMAgent width={64} height={64} />
    </div>
  ),
}

export const DBAgentSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <DBAgent width={24} height={24} />
      <DBAgent width={32} height={32} />
      <DBAgent width={48} height={48} />
      <DBAgent width={64} height={64} />
    </div>
  ),
}

export const QAAgentSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <QAAgent width={24} height={24} />
      <QAAgent width={32} height={32} />
      <QAAgent width={48} height={48} />
      <QAAgent width={64} height={64} />
    </div>
  ),
}
