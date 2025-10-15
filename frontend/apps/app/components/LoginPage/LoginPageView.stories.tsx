import type { Meta, StoryObj } from '@storybook/nextjs'
import { LoginPageView } from './LoginPageView'

const meta = {
  component: LoginPageView,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    returnTo: {
      description: 'URL to redirect to after login',
      control: 'text',
    },
    showLogoutToast: {
      description: 'Show logout toast notification',
      control: 'boolean',
    },
  },
} satisfies Meta<typeof LoginPageView>

export default meta
type Story = StoryObj<typeof LoginPageView>

export const Default: Story = {
  name: 'Default',
  args: {
    returnTo: '/design_sessions/new',
    showLogoutToast: false,
  },
}

export const WithLogoutToast: Story = {
  name: 'With logout toast',
  args: {
    returnTo: '/design_sessions/new',
    showLogoutToast: true,
  },
}

export const CustomReturnUrl: Story = {
  name: 'Custom return URL',
  args: {
    returnTo: '/projects',
    showLogoutToast: false,
  },
}
