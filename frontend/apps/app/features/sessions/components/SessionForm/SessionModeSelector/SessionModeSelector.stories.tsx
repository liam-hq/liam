import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { type SessionMode, SessionModeSelector } from './SessionModeSelector'

const meta = {
  component: SessionModeSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SessionModeSelector>

export default meta
type Story = StoryObj<typeof meta>

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

export const Interactive: Story = {
  args: {
    selectedMode: 'github',
    onModeChange: () => {},
  },
  render: (args) => {
    const [selectedMode, setSelectedMode] = useState<SessionMode>(
      args.selectedMode,
    )

    return (
      <SessionModeSelector
        {...args}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive version where you can click to change modes',
      },
    },
  },
}
