import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../Button'
import {
  ArrowTooltipContent,
  ArrowTooltipPortal,
  ArrowTooltipProvider,
  ArrowTooltipRoot,
  ArrowTooltipTrigger,
} from './ArrowTooltip'

const meta: Meta<typeof ArrowTooltipContent> = {
  component: ArrowTooltipContent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ArrowTooltipProvider>
      <ArrowTooltipRoot>
        <ArrowTooltipTrigger asChild>
          <Button>Hover me</Button>
        </ArrowTooltipTrigger>
        <ArrowTooltipPortal>
          <ArrowTooltipContent side="top" align="center">
            This is a tooltip with an arrow
          </ArrowTooltipContent>
        </ArrowTooltipPortal>
      </ArrowTooltipRoot>
    </ArrowTooltipProvider>
  ),
}

export const DifferentPositions: Story = {
  render: () => (
    <ArrowTooltipProvider>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
          <ArrowTooltipRoot key={side}>
            <ArrowTooltipTrigger asChild>
              <Button>{side}</Button>
            </ArrowTooltipTrigger>
            <ArrowTooltipPortal>
              <ArrowTooltipContent side={side} align="center">
                Tooltip on {side}
              </ArrowTooltipContent>
            </ArrowTooltipPortal>
          </ArrowTooltipRoot>
        ))}
      </div>
    </ArrowTooltipProvider>
  ),
}

export const CustomDistance: Story = {
  render: () => (
    <ArrowTooltipProvider>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <ArrowTooltipRoot>
          <ArrowTooltipTrigger asChild>
            <Button>Default (3px)</Button>
          </ArrowTooltipTrigger>
          <ArrowTooltipPortal>
            <ArrowTooltipContent side="top" align="center">
              Default distance (3px)
            </ArrowTooltipContent>
          </ArrowTooltipPortal>
        </ArrowTooltipRoot>
        <ArrowTooltipRoot>
          <ArrowTooltipTrigger asChild>
            <Button>Custom (16px)</Button>
          </ArrowTooltipTrigger>
          <ArrowTooltipPortal>
            <ArrowTooltipContent side="top" align="center" sideOffset={16}>
              Custom distance (16px)
            </ArrowTooltipContent>
          </ArrowTooltipPortal>
        </ArrowTooltipRoot>
        <ArrowTooltipRoot>
          <ArrowTooltipTrigger asChild>
            <Button>Close (2px)</Button>
          </ArrowTooltipTrigger>
          <ArrowTooltipPortal>
            <ArrowTooltipContent side="top" align="center" sideOffset={2}>
              Close distance (2px)
            </ArrowTooltipContent>
          </ArrowTooltipPortal>
        </ArrowTooltipRoot>
      </div>
    </ArrowTooltipProvider>
  ),
}
