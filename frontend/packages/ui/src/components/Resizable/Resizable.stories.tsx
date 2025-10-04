import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './Resizable'

const ResizableExample = () => {
  const [isResizing, setIsResizing] = useState(false)

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={() => setIsResizing(false)}
      style={{ height: '400px', border: '1px solid #ccc' }}
    >
      <ResizablePanel defaultSize={50} minSize={20} isResizing={isResizing}>
        <div style={{ padding: '16px', height: '100%', background: '#f0f0f0' }}>
          Panel 1 - Resize me
        </div>
      </ResizablePanel>
      <ResizableHandle
        withHandle
        onDragging={(isDragging) => setIsResizing(isDragging)}
      />
      <ResizablePanel defaultSize={50} minSize={20} isResizing={isResizing}>
        <div style={{ padding: '16px', height: '100%', background: '#e0e0e0' }}>
          Panel 2
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

const ResizableVerticalExample = () => {
  const [isResizing, setIsResizing] = useState(false)

  return (
    <ResizablePanelGroup
      direction="vertical"
      onLayout={() => setIsResizing(false)}
      style={{ height: '400px', border: '1px solid #ccc' }}
    >
      <ResizablePanel defaultSize={50} minSize={20} isResizing={isResizing}>
        <div style={{ padding: '16px', height: '100%', background: '#f0f0f0' }}>
          Top Panel
        </div>
      </ResizablePanel>
      <ResizableHandle
        withHandle
        onDragging={(isDragging) => setIsResizing(isDragging)}
      />
      <ResizablePanel defaultSize={50} minSize={20} isResizing={isResizing}>
        <div style={{ padding: '16px', height: '100%', background: '#e0e0e0' }}>
          Bottom Panel
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

const meta = {
  component: ResizablePanelGroup,
  parameters: {
    docs: {
      description: {
        component:
          'A react-resizable-panels wrapper. Use ResizablePanelGroup, ResizablePanel, and ResizableHandle together to create resizable layouts.',
      },
    },
  },
} satisfies Meta<typeof ResizablePanelGroup>

export default meta
type Story = StoryObj<typeof ResizablePanelGroup>

export const Horizontal: Story = {
  render: () => <ResizableExample />,
}

export const Vertical: Story = {
  render: () => <ResizableVerticalExample />,
}
