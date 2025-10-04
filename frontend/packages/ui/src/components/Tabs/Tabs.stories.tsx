import type { Meta, StoryObj } from '@storybook/nextjs'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from './Tabs'

const TabsExample = () => {
  return (
    <TabsRoot defaultValue="tab1">
      <TabsList style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div style={{ padding: '16px', border: '1px solid #ccc' }}>
          Content for Tab 1
        </div>
      </TabsContent>
      <TabsContent value="tab2">
        <div style={{ padding: '16px', border: '1px solid #ccc' }}>
          Content for Tab 2
        </div>
      </TabsContent>
      <TabsContent value="tab3">
        <div style={{ padding: '16px', border: '1px solid #ccc' }}>
          Content for Tab 3
        </div>
      </TabsContent>
    </TabsRoot>
  )
}

const meta = {
  component: TabsRoot,
  parameters: {
    docs: {
      description: {
        component:
          'A Radix UI Tabs wrapper. Use TabsRoot, TabsList, TabsTrigger, and TabsContent together to create tabbed interfaces.',
      },
    },
  },
} satisfies Meta<typeof TabsRoot>

export default meta
type Story = StoryObj<typeof TabsRoot>

export const Default: Story = {
  render: () => <TabsExample />,
}
