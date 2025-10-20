import type { Meta, StoryObj } from '@storybook/nextjs'
import { CookieConsent } from './CookieConsent'

const meta = {
  component: CookieConsent,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof CookieConsent>

export default meta
type Story = StoryObj<typeof CookieConsent>

export const Default: Story = {}
