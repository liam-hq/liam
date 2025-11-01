import type { Meta, StoryObj } from '@storybook/nextjs'
import { PROJECT_TAB, type ProjectTab } from '../projectConstants'
import { TabItem } from './TabItem'

const TABS: readonly [ProjectTab, ProjectTab, ProjectTab] = [
  { value: PROJECT_TAB.PROJECT, label: 'Project' },
  { value: PROJECT_TAB.SCHEMA, label: 'Schema' },
  { value: PROJECT_TAB.SESSIONS, label: 'Sessions' },
]

const meta = {
  component: TabItem,
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/projects/123/ref/main',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    item: {
      description: 'Tab item configuration',
    },
    projectId: {
      control: 'text',
      description: 'Project ID',
    },
    branchOrCommit: {
      control: 'text',
      description: 'Branch name or commit hash',
    },
    schemaFilePath: {
      control: 'text',
      description: 'Schema file path (required for schema tab)',
    },
  },
  args: {
    projectId: 'my-project',
    branchOrCommit: 'main',
    item: TABS[0],
  },
} satisfies Meta<typeof TabItem>

export default meta
type Story = StoryObj<typeof TabItem>

export const Default: Story = {
  render: (args) => {
    const [projectTab, schemaTab, sessionsTab] = TABS
    return (
      <>
        <TabItem {...args} item={projectTab} />
        <TabItem {...args} item={schemaTab} schemaFilePath="schema.sql" />
        <TabItem {...args} item={sessionsTab} />
      </>
    )
  },
}
