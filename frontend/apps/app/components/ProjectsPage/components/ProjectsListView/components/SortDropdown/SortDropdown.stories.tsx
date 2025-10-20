import type { Meta, StoryObj } from '@storybook/nextjs'
import { SortDropdown } from './SortDropdown'

const meta = {
  component: SortDropdown,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    initialSortOption: {
      control: 'radio',
      options: ['activity', 'name'],
      description: 'Initial sort option',
    },
    onSortChange: {
      action: 'sort changed',
      description: 'Callback when sort option changes',
    },
  },
} satisfies Meta<typeof SortDropdown>

export default meta
type Story = StoryObj<typeof SortDropdown>

export const Default: Story = {
  args: {
    initialSortOption: 'activity',
  },
}

export const SortByName: Story = {
  args: {
    initialSortOption: 'name',
  },
}
