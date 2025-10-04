import type { Meta, StoryObj } from '@storybook/nextjs'
import { Spinner } from './Spinner'

const meta = {
  component: Spinner,
  argTypes: {
    size: {
      control: 'select',
      options: ['12', '14', '16'],
      description: 'Size of the spinner',
    },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {
  args: {
    size: '16',
  },
}

export const Size12: Story = {
  args: {
    size: '12',
  },
}

export const Size14: Story = {
  args: {
    size: '14',
  },
}

export const Size16: Story = {
  args: {
    size: '16',
  },
}
