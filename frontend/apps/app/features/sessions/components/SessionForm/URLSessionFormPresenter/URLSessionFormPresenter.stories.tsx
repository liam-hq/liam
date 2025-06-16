import type { Meta, StoryObj } from '@storybook/react'
import { URLSessionFormPresenter } from './URLSessionFormPresenter'

type URLSessionFormPresenterProps = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
}

const meta: Meta<URLSessionFormPresenterProps> = {
  title: 'Features/Sessions/URLSessionFormPresenter',
  component: URLSessionFormPresenter,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<URLSessionFormPresenterProps>

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
