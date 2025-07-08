import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'
import { BuildAgent } from './BuildAgent'

type BuildAgentProps = ComponentProps<typeof BuildAgent>

const meta = {
  component: BuildAgent,
  title: 'Components/Chat/AgentAvatar/BuildAgent',
} satisfies Meta<typeof BuildAgent>

export default meta
type Story = StoryObj<BuildAgentProps>

export const Default: Story = {
  args: {},
}

export const CustomSize: Story = {
  args: {
    width: 48,
    height: 48,
  },
}
