import { aSchema } from '@liam-hq/schema'
import { TabsRoot } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/react'
import { type ComponentProps, type FC, useCallback, useState } from 'react'
import {
  DEFAULT_OUTPUT_TAB,
  OUTPUT_TABS,
  type OutputTabValue,
} from '../../constants'
import { Header } from './Header'

const HeaderDemo: FC<ComponentProps<typeof Header>> = (props) => {
  const [tabValue, setTabValue] = useState<OutputTabValue>(DEFAULT_OUTPUT_TAB)

  const isTabValue = (value: string): value is OutputTabValue => {
    return Object.values(OUTPUT_TABS).some((tabValue) => tabValue === value)
  }

  const handleChangeValue = useCallback((value: string) => {
    if (isTabValue(value)) {
      setTabValue(value)
    }
  }, [])

  return (
    <TabsRoot
      value={tabValue}
      style={{ minWidth: '400px', width: '100%' }}
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
