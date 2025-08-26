import type { Meta, StoryObj } from '@storybook/nextjs'
import { SignInModal } from './SignInModal'

const meta = {
  component: SignInModal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SignInModal>

export default meta
type Story = StoryObj<typeof SignInModal>

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSwitchToSignUp: () => {},
    returnTo: '/app/design_sessions/new',
  },
}
