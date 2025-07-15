import type { Meta, StoryObj } from '@storybook/react'
import { VersionMessageDemo } from './VersionMessageDemo'

const meta = {
  component: VersionMessageDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VersionMessageDemo>

export default meta
type Story = StoryObj<typeof meta>

// Multiple operations example
export const MultipleOperationsClosed: Story = {
  args: {
    versionNumber: 1,
    onView: () => {},
    operations: [
      {
        path: ['tables', 'users', 'columns', 'email'],
        status: 'Added',
        statusClass: 'statusAdded',
      },
      {
        path: ['tables', 'posts', 'users', 'title'],
        status: 'Modified',
        statusClass: 'statusModified',
      },
      {
        path: ['tables', 'comments'],
        status: 'Removed',
        statusClass: 'statusRemoved',
      },
      {
        path: ['tables', 'archive'],
        status: 'Moved',
        statusClass: 'statusMoved',
      },
      {
        path: ['tables', 'new_copy'],
        status: 'Copied',
        statusClass: 'statusCopied',
      },
      {
        path: ['tables', 'test_table'],
        status: 'Tested',
        statusClass: 'statusTested',
      },
    ],
    initialExpanded: false,
  },
  name: 'Multiple Operations (Closed)',
}

export const MultipleOperationsOpen: Story = {
  args: {
    ...MultipleOperationsClosed.args,
    initialExpanded: true,
  },
  name: 'Multiple Operations (Open)',
}

// Empty operations (schema generated)
export const EmptyOperationsClosed: Story = {
  args: {
    versionNumber: 1,
    operations: [],
    initialExpanded: false,
    onView: () => {},
  },
  name: 'Empty Operations (Closed)',
}

export const EmptyOperationsOpen: Story = {
  args: {
    versionNumber: 1,
    operations: [],
    initialExpanded: true,
  },
  name: 'Empty Operations (Open)',
}

// Many operations example
export const ManyOperationsClosed: Story = {
  args: {
    versionNumber: 3,
    onView: () => {},
    operations: [
      {
        path: ['tables', 'users', 'columns', 'email'],
        status: 'Added',
        statusClass: 'statusAdded',
      },
      {
        path: ['tables', 'users', 'columns', 'phone'],
        status: 'Added',
        statusClass: 'statusAdded',
      },
      {
        path: ['tables', 'users', 'columns', 'address'],
        status: 'Added',
        statusClass: 'statusAdded',
      },
      {
        path: ['tables', 'posts', 'columns', 'title'],
        status: 'Modified',
        statusClass: 'statusModified',
      },
      {
        path: ['tables', 'posts', 'columns', 'content'],
        status: 'Modified',
        statusClass: 'statusModified',
      },
      {
        path: ['tables', 'posts', 'columns', 'published_at'],
        status: 'Modified',
        statusClass: 'statusModified',
      },
      {
        path: ['tables', 'comments'],
        status: 'Removed',
        statusClass: 'statusRemoved',
      },
      {
        path: ['tables', 'likes'],
        status: 'Removed',
        statusClass: 'statusRemoved',
      },
      {
        path: ['tables', 'archive', 'posts'],
        status: 'Moved',
        statusClass: 'statusMoved',
      },
      {
        path: ['tables', 'archive', 'comments'],
        status: 'Moved',
        statusClass: 'statusMoved',
      },
      {
        path: ['tables', 'backup', 'users'],
        status: 'Copied',
        statusClass: 'statusCopied',
      },
      {
        path: ['tables', 'backup', 'posts'],
        status: 'Copied',
        statusClass: 'statusCopied',
      },
      {
        path: ['tables', 'test', 'integration', 'user_flow'],
        status: 'Tested',
        statusClass: 'statusTested',
      },
      {
        path: ['tables', 'test', 'integration', 'post_flow'],
        status: 'Tested',
        statusClass: 'statusTested',
      },
      {
        path: ['tables', 'test', 'unit', 'validation'],
        status: 'Tested',
        statusClass: 'statusTested',
      },
    ],
    initialExpanded: false,
  },
  name: 'Many Operations (Closed)',
}

export const ManyOperationsOpen: Story = {
  args: {
    ...ManyOperationsClosed.args,
    initialExpanded: true,
  },
  name: 'Many Operations (Open)',
}
