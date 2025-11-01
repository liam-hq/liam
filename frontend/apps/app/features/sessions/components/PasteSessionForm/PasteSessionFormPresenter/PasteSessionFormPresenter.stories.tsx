import type { Meta, StoryObj } from '@storybook/nextjs'
import { PasteSessionFormPresenter } from './PasteSessionFormPresenter'

const meta = {
  component: PasteSessionFormPresenter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  render: (args) => {
    return (
      <div style={{ width: '800px' }}>
        <PasteSessionFormPresenter {...args} />
      </div>
    )
  },
} satisfies Meta<typeof PasteSessionFormPresenter>

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

export const WithSQLSchema: Story = {
  args: {
    isPending: false,
    formAction: () => {},
  },
  render: (args) => {
    return (
      <div style={{ width: '800px' }}>
        <PasteSessionFormPresenter {...args} />
      </div>
    )
  },
}

export const WithPrismaSchema: Story = {
  args: {
    isPending: false,
    formAction: () => {},
  },
  render: (args) => {
    return (
      <div style={{ width: '800px' }}>
        <PasteSessionFormPresenter {...args} />
      </div>
    )
  },
}
