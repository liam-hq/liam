import type { Meta, StoryObj } from '@storybook/react'
import { UploadSessionFormPresenter } from './UploadSessionFormPresenter'

const meta = {
  component: UploadSessionFormPresenter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  render: (args) => {
    return (
      <div style={{ width: '800px' }}>
        <UploadSessionFormPresenter {...args} />
      </div>
    )
  },
} satisfies Meta<typeof UploadSessionFormPresenter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isPending: false,
    formAction: () => {},
  },
}

export const WithFormError: Story = {
  args: {
    formError: 'Please enter a valid message.',
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
