import { ToastProvider } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/react'
import { ShareButton } from './ShareButton'

const meta = {
  component: ShareButton,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof ShareButton>

export default meta
type Story = StoryObj<typeof ShareButton>

export const Default: Story = {
  args: {
    designSessionId: 'test-session-id',
    initialIsPublic: false,
  },
}

export const PublicShare: Story = {
  args: {
    designSessionId: 'test-session-id',
    initialIsPublic: true,
  },
}
