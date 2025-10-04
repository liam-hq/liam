import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { Button } from '../Button'
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from './Collapsible'

const CollapsibleExample = () => {
  const [open, setOpen] = useState(false)

  return (
    <CollapsibleRoot open={open} onOpenChange={setOpen}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <CollapsibleTrigger asChild>
          <Button>{open ? 'Hide' : 'Show'} Details</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div style={{ padding: '16px', background: '#f0f0f0' }}>
            This is the collapsible content. It can contain any React elements.
            You can add more content here as needed.
          </div>
        </CollapsibleContent>
      </div>
    </CollapsibleRoot>
  )
}

const meta = {
  component: CollapsibleRoot,
  parameters: {
    docs: {
      description: {
        component:
          'A Radix UI Collapsible wrapper. Use CollapsibleRoot, CollapsibleTrigger, and CollapsibleContent together to create collapsible sections.',
      },
    },
  },
} satisfies Meta<typeof CollapsibleRoot>

export default meta
type Story = StoryObj<typeof CollapsibleRoot>

export const Default: Story = {
  render: () => <CollapsibleExample />,
}
