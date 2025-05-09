import type { Meta, StoryObj } from '@storybook/react'
import type { ReactNode } from 'react'
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from './Tooltip'

// Demo component to showcase the Tooltip
interface TooltipDemoProps {
  content: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  triggerText?: string
}

const TooltipDemo = ({
  content = 'Tooltip content',
  side = 'bottom',
  triggerText = 'Hover me',
}: TooltipDemoProps) => {
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <button
            type="button"
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              backgroundColor: '#333',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {triggerText}
          </button>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side={side} sideOffset={4}>
            {content}
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  )
}

const meta: Meta<typeof TooltipDemo> = {
  title: 'UI/Tooltip',
  component: TooltipDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TooltipDemo>

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    side: 'bottom',
  },
}

export const Top: Story = {
  args: {
    content: 'Tooltip on top',
    side: 'top',
  },
}

export const Right: Story = {
  args: {
    content: 'Tooltip on right',
    side: 'right',
  },
}

export const Left: Story = {
  args: {
    content: 'Tooltip on left',
    side: 'left',
  },
}

export const LongContent: Story = {
  args: {
    content:
      'This is a tooltip with a longer text content to demonstrate how it wraps',
    side: 'bottom',
  },
}

export const WithHTMLContent: Story = {
  args: {
    content: (
      <div>
        <strong>Bold text</strong>
        <div>Multiple lines</div>
        <div>of content</div>
      </div>
    ),
    side: 'bottom',
  },
}

export const CustomTrigger: Story = {
  args: {
    content: 'Custom trigger button',
    triggerText: 'Custom Button',
    side: 'bottom',
  },
}
