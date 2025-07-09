import type { Meta, StoryObj } from '@storybook/react'
import { URLSessionFormPresenter } from './UrlSessionFormPresenter'

const meta = {
  component: URLSessionFormPresenter,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof URLSessionFormPresenter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isPending: false,
    formAction: () => {},
  },
}

export const WithError: Story = {
  args: {
    formError: 'Please enter a valid URL.',
    isPending: false,
    formAction: () => {},
  },
}

export const Pending: Story = {
  args: {
    isPending: true,
    formAction: () => {},
  },
}

export const PendingWithError: Story = {
  args: {
    formError: 'Failed to fetch schema. Please check the URL.',
    isPending: true,
    formAction: () => {},
  },
}
