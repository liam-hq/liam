import type { Meta, StoryObj } from '@storybook/nextjs'
import { Fallback } from './Fallback'

const meta = {
  component: Fallback,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    panelSizes: {
      control: 'object',
      description: 'Array of panel sizes [chatSize, outputSize]',
    },
  },
} satisfies Meta<typeof Fallback>

export default meta
type Story = StoryObj<typeof Fallback>

export const Default: Story = {
  args: {
    panelSizes: [40, 60],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: '100vw' }}>
        <Story />
      </div>
    ),
  ],
}

export const ChatFocused: Story = {
  args: {
    panelSizes: [60, 40],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: '100vw' }}>
        <Story />
      </div>
    ),
  ],
}

export const OutputFocused: Story = {
  args: {
    panelSizes: [30, 70],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: '100vw' }}>
        <Story />
      </div>
    ),
  ],
}

export const Balanced: Story = {
  args: {
    panelSizes: [50, 50],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: '100vw' }}>
        <Story />
      </div>
    ),
  ],
}
