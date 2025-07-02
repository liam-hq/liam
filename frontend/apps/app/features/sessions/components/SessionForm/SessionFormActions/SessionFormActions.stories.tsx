import type { Meta } from '@storybook/nextjs'
import { useState } from 'react'
import { SessionFormActions } from './SessionFormActions'

const meta = {
  title: 'Features/Sessions/SessionFormActions',
  component: SessionFormActions,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SessionFormActions>

export default meta

// Default state - no content
export const Default = {
  args: {
    isPending: false,
    hasContent: false,
    onMicClick: () => {},
    onAttachClick: () => {},
    onSubmit: () => {},
    onCancel: () => {},
  },
}

// With content - Send button in "Can Send" state
export const WithContent = {
  args: {
    isPending: false,
    hasContent: true,
    onMicClick: () => {},
    onAttachClick: () => {},
    onSubmit: () => {},
    onCancel: () => {},
  },
}

// Pending state - shows Cancel button
export const Pending = {
  args: {
    isPending: true,
    hasContent: true,
    onMicClick: () => {},
    onAttachClick: () => {},
    onSubmit: () => {},
    onCancel: () => {},
  },
}

// Interactive demo
export const Interactive = () => {
  const [isPending, setIsPending] = useState(false)
  const [hasContent, setHasContent] = useState(false)

  const handleSubmit = () => {
    if (hasContent) {
      setIsPending(true)
      // Simulate async operation
      setTimeout(() => {
        setIsPending(false)
        alert('Submission complete!')
      }, 3000)
    }
  }

  const handleCancel = () => {
    setIsPending(false)
    alert('Submission cancelled')
  }

  return (
    <div style={{ width: '600px' }}>
      <div style={{ marginBottom: '30px', display: 'flex', gap: '20px' }}>
        <label
          style={{
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <input
            type="checkbox"
            checked={hasContent}
            onChange={(e) => setHasContent(e.target.checked)}
            disabled={isPending}
          />
          Has Content
        </label>
        <label
          style={{
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <input
            type="checkbox"
            checked={isPending}
            onChange={(e) => setIsPending(e.target.checked)}
          />
          Is Pending
        </label>
      </div>

      <SessionFormActions
        isPending={isPending}
        hasContent={hasContent}
        onMicClick={() => alert('Mic clicked')}
        onAttachClick={() => alert('Attach clicked')}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />

      <div
        style={{
          marginTop: '30px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div>• Check "Has Content" to enable the Send button</div>
        <div>• Send button turns green when content is available</div>
        <div>• Click Send to simulate submission (3 second delay)</div>
        <div>• Cancel button appears during submission</div>
        <div>• Click Cancel to stop the submission</div>
      </div>
    </div>
  )
}
