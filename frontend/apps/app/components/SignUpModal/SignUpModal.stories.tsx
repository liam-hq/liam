import type { Meta, StoryObj } from '@storybook/nextjs'
import { SignUpModal } from './SignUpModal'

const meta = {
  component: SignUpModal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SignUpModal>

export default meta
type Story = StoryObj<typeof SignUpModal>

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSwitchToSignIn: () => {},
  },
}
