import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'
import { AskAgent } from './AskAgent'

type AskAgentProps = ComponentProps<typeof AskAgent>

const meta = {
  component: AskAgent,
  title: 'Components/Chat/AgentAvatar/AskAgent',
} satisfies Meta<typeof AskAgent>

export default meta
type Story = StoryObj<AskAgentProps>

export const Default: Story = {
  args: {},
}

export const CustomSize: Story = {
  args: {
    width: 48,
    height: 48,
  },
}
