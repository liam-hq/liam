import { aSchema } from '@liam-hq/schema'
import { TabsRoot } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { type ComponentProps, type FC, useCallback, useState } from 'react'
import {
  DEFAULT_OUTPUT_TAB,
  OUTPUT_TABS,
  type OutputTabValue,
} from '../../constants'
import { Header } from './Header'

const HeaderDemo: FC<ComponentProps<typeof Header>> = (props) => {
  const [tabValue, setTabValue] = useState<OutputTabValue>(DEFAULT_OUTPUT_TAB)

  const isTabValue = useCallback((value: string): value is OutputTabValue => {
    return Object.values(OUTPUT_TABS).some((tabValue) => tabValue === value)
  }, [])

  const handleChangeValue = useCallback(
    (value: string) => {
      if (isTabValue(value)) {
        setTabValue(value)
      }
    },
    [isTabValue],
  )

  return (
    <TabsRoot
      value={tabValue}
      style={{ minWidth: '700px', width: '100%' }}
      onValueChange={handleChangeValue}
    >
      <Header {...props} tabValue={tabValue} />
    </TabsRoot>
  )
}

const meta = {
  component: Header,
  globals: {
    backgrounds: { value: 'var(--global-background)', grid: false },
  },
  args: {
    schema: aSchema(),
    tabValue: 'artifact',
    versions: [],
    selectedVersion: {
      id: '',
      building_schema_id: '',
      number: 1,
      patch: {},
      reverse_patch: {},
    },
    onSelectedVersionChange: () => {},
    designSessionId: 'test-session-id',
    initialIsPublic: false,
  },
  render: (args) => <HeaderDemo {...args} />,
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithArtifactDoc: Story = {
  args: {
    tabValue: OUTPUT_TABS.ARTIFACT,
    analyzedRequirements: {
      goal: 'Create database schema for user management and content system',
      testcases: {
        users: [
          {
            id: 'tc-1',
            title: 'Create user with email',
            type: 'INSERT',
            sql: 'INSERT INTO users (email, created_at) VALUES (?, ?)',
            testResults: [],
          },
        ],
        posts: [
          {
            id: 'tc-2',
            title: 'Create post for user',
            type: 'INSERT',
            sql: 'INSERT INTO posts (user_id, title, content, published_at) VALUES (?, ?, ?, ?)',
            testResults: [],
          },
        ],
      },
    },
  },
}
