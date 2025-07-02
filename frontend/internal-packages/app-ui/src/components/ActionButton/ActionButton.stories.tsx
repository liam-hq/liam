import type { Meta } from '@storybook/react'
import { useState } from 'react'
import { ActionButton } from './ActionButton'

const meta = {
  title: 'features/sessions/ActionButton',
  component: ActionButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActionButton>

export default meta

export const Default = {
  args: {
    hasContent: false,
    isPending: false,
    onSubmit: () => {},
    onCancel: () => {},
  },
}

export const WithContent = {
  args: {
    hasContent: true,
    isPending: false,
    onSubmit: () => {},
    onCancel: () => {},
  },
}

export const Pending = {
  args: {
    hasContent: true,
    isPending: true,
    onSubmit: () => {},
    onCancel: () => {},
  },
}

export const States = () => (
  <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <ActionButton
        hasContent={false}
        isPending={false}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
      <p style={{ marginTop: '8px', fontSize: '12px' }}>No Content</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <ActionButton
        hasContent={true}
        isPending={false}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
      <p style={{ marginTop: '8px', fontSize: '12px' }}>With Content</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <ActionButton
        hasContent={true}
        isPending={true}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
      <p style={{ marginTop: '8px', fontSize: '12px' }}>Pending</p>
    </div>
  </div>
)

export const Interactive = () => {
  const [hasContent, setHasContent] = useState(false)
  const [isPending, setIsPending] = useState(false)

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
}
