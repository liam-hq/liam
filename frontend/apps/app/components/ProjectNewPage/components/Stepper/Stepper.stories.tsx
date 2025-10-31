import type { Meta, StoryObj } from '@storybook/nextjs'
import { Stepper } from './Stepper'

const meta = {
  component: Stepper,
  parameters: {
    layout: 'centered',
  },
  args: {
    steps: [
      { label: 'Project Information' },
      { label: 'Installation Method' },
      { label: 'Confirmation' },
    ],
  },
} satisfies Meta<typeof Stepper>

export default meta
type Story = StoryObj<typeof Stepper>

export const Step1: Story = {
  args: {
    activeIndex: 0,
  },
}

export const Step2: Story = {
  args: {
    activeIndex: 1,
  },
}

export const Step3: Story = {
  args: {
    activeIndex: 2,
  },
}
