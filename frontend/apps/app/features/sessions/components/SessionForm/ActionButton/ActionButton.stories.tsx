import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ActionButton } from './ActionButton'

const meta = {
  component: ActionButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  render: (args) => <ActionButton {...args} />,
} satisfies Meta<typeof ActionButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    hasContent: false,
    isPending: false,
    onSubmit: () => {},
    onCancel: () => {},
  },
}

export const WithContent: Story = {
  args: {
    hasContent: true,
    isPending: false,
    onSubmit: () => {},
    onCancel: () => {},
  },
}

export const Pending: Story = {
  args: {
    hasContent: true,
    isPending: true,
    onSubmit: () => {},
    onCancel: () => {},
  },
}

export const States: Story = {
  args: {
    hasContent: false,
    isPending: false,
    onSubmit: () => {},
    onCancel: () => {},
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <ActionButton {...args} hasContent={false} isPending={false} />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>No Content</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <ActionButton {...args} hasContent={true} isPending={false} />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>With Content</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <ActionButton {...args} hasContent={true} isPending={true} />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>Pending</p>
      </div>
    </div>
  ),
}

export const Interactive: Story = {
  args: {
    hasContent: false,
    isPending: false,
    onSubmit: () => {},
    onCancel: () => {},
  },
  render: (args) => {
    const [hasContent, setHasContent] = useState(args.hasContent)
    const [isPending, setIsPending] = useState(args.isPending)

    const handleSubmit = () => {
      if (hasContent) {
        setIsPending(true)
        // Simulate API call
        setTimeout(() => {
          setIsPending(false)
          setHasContent(false)
        }, 2000)
      }
    }

    const handleCancel = () => {
      setIsPending(false)
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '300px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Type something..."
            onChange={(e) => setHasContent(e.target.value.length > 0)}
            disabled={isPending}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '14px',
            }}
          />
          <ActionButton
            {...args}
            hasContent={hasContent}
            isPending={isPending}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {isPending ? (
            <p>Processing... Click "Stop" to cancel</p>
          ) : (
            <p>Type something to enable the send button</p>
          )}
        </div>
      </div>
    )
  },
}
