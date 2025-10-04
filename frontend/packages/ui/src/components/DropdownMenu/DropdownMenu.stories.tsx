import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { Button } from '../Button'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu'

const DropdownMenuExample = () => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button>Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="danger">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}

const DropdownMenuWithIconsExample = () => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button>Menu with Icons</Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuItem leftIcon={<span>📄</span>}>
            New File
          </DropdownMenuItem>
          <DropdownMenuItem leftIcon={<span>📁</span>}>
            New Folder
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="danger" leftIcon={<span>🗑️</span>}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}

const DropdownMenuRadioExample = () => {
  const [value, setValue] = useState('option1')

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button>Radio Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuLabel>Select an option</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
            <DropdownMenuRadioItem value="option1" label="Option 1" />
            <DropdownMenuRadioItem value="option2" label="Option 2" />
            <DropdownMenuRadioItem value="option3" label="Option 3" />
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}

const meta = {
  component: DropdownMenuRoot,
  parameters: {
    docs: {
      description: {
        component: 'A Radix UI DropdownMenu wrapper with various compositions.',
      },
    },
  },
} satisfies Meta<typeof DropdownMenuRoot>

export default meta
type Story = StoryObj<typeof DropdownMenuRoot>

export const Default: Story = {
  render: () => <DropdownMenuExample />,
}

export const WithIcons: Story = {
  render: () => <DropdownMenuWithIconsExample />,
}

export const RadioItems: Story = {
  render: () => <DropdownMenuRadioExample />,
}
