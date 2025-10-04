import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from '../Button'
import {
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from './Popover'

const PopoverExample = () => {
  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <Button>Open Popover</Button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent>
          <div style={{ padding: '16px', maxWidth: '300px' }}>
            <h4 style={{ marginTop: 0 }}>Popover Title</h4>
            <p style={{ margin: '8px 0' }}>
              This is a popover component built with Radix UI. You can add any
              content here.
            </p>
            <PopoverClose asChild>
              <Button size="sm">Close</Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  )
}

const meta = {
  component: PopoverRoot,
  parameters: {
    docs: {
      description: {
        component:
          'A Radix UI Popover wrapper. Use PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent, and PopoverClose together.',
      },
    },
  },
} satisfies Meta<typeof PopoverRoot>

export default meta
type Story = StoryObj<typeof PopoverRoot>

export const Default: Story = {
  render: () => <PopoverExample />,
}
