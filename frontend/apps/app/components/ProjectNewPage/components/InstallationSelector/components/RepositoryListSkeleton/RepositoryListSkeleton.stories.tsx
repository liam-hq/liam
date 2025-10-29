import type { Meta, StoryObj } from '@storybook/nextjs'
import { RepositoryListSkeleton } from './RepositoryListSkeleton'

const meta = {
  component: RepositoryListSkeleton,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RepositoryListSkeleton>

export default meta
type Story = StoryObj<typeof RepositoryListSkeleton>

export const Default: Story = {}
