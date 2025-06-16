import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { type SessionMode, SessionModeSelector } from './SessionModeSelector'

type SessionModeSelectorProps = {
  selectedMode: SessionMode
  onModeChange: (mode: SessionMode) => void
}

const meta: Meta<SessionModeSelectorProps> = {
  title: 'Features/Sessions/SessionModeSelector',
  component: SessionModeSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<SessionModeSelectorProps>

// Interactive story with state management
const InteractiveTemplate = (args: { selectedMode: SessionMode }) => {
  const [selectedMode, setSelectedMode] = useState<SessionMode>(
    args.selectedMode,
  )

  return (
    <SessionModeSelector
      selectedMode={selectedMode}
      onModeChange={setSelectedMode}
    />
  )
}

export const Default: Story = {
  args: {
    selectedMode: 'github',
    onModeChange: () => {},
  },
}

export const GitHubSelected: Story = {
  args: {
    selectedMode: 'github',
    onModeChange: () => {},
  },
}

export const UploadSelected: Story = {
  args: {
    selectedMode: 'upload',
    onModeChange: () => {},
  },
}

export const URLSelected: Story = {
  args: {
    selectedMode: 'url',
    onModeChange: () => {},
  },
}

export const Interactive = {
  render: () => <InteractiveTemplate selectedMode="github" />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive version where you can click to change modes',
      },
    },
  },
}
