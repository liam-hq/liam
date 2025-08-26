import type { Meta, StoryObj } from '@storybook/nextjs'
import { CtaBar } from './CtaBar'

const meta = {
  component: CtaBar,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof CtaBar>

export default meta
type Story = StoryObj<typeof CtaBar>

export const Default: Story = {
  args: {
    onSignUpClick: () => {},
  },
}
