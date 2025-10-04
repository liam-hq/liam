import type { Meta, StoryObj } from '@storybook/nextjs'
import { CookieConsent } from './CookieConsent'

const meta = {
  component: CookieConsent,
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the cookie consent banner is visible',
    },
  },
} satisfies Meta<typeof CookieConsent>

export default meta
type Story = StoryObj<typeof CookieConsent>

export const Open: Story = {
  args: {
    open: true,
    onClickAccept: () => {},
    onClickDeny: () => {},
  },
}

export const Closed: Story = {
  args: {
    open: false,
    onClickAccept: () => {},
    onClickDeny: () => {},
  },
}
