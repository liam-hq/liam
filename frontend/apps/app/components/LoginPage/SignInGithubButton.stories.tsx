import type { Meta, StoryObj } from '@storybook/nextjs'
import { SignInGithubButton } from './SignInGithubButton'

const meta = {
  component: SignInGithubButton,
  argTypes: {
    returnTo: {
      control: 'text',
      description: 'The URL to return to after successful login',
    },
  },
} satisfies Meta<typeof SignInGithubButton>

export default meta
type Story = StoryObj<typeof SignInGithubButton>

export const Default: Story = {
  args: {
    returnTo: '/',
  },
}

export const WithReturnPath: Story = {
  args: {
    returnTo: '/projects/my-project',
  },
}
