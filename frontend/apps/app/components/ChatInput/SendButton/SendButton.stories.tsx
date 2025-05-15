import type { Meta } from '@storybook/react'
import { useState } from 'react'
import { SendButton } from './SendButton'

const meta = {
  component: SendButton,
  title: 'Components/Chat/ChatInput/SendButton',
} satisfies Meta<typeof SendButton>

export default meta

// Default state (no content)
export const Default = {
  args: {
    hasContent: false,
    onClick: () => {},
    disabled: false,
  },
}

// Can send state (with content)
export const CanSend = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: false,
  },
}

// Disabled state
export const Disabled = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: true,
  },
}

// With tooltip visible
export const WithTooltip = () => {
  return (
    <div style={{ padding: '40px 20px' }}>
      {/* Added extra padding to ensure tooltip is visible in Storybook */}
      <div style={{ paddingTop: '30px' }}>
        <SendButton hasContent={true} onClick={() => {}} disabled={false} />
      </div>
    </div>
  )
}

// Interactive demo
export const Interactive = () => {
  const [hasContent, setHasContent] = useState(false)

  return (
    <div style={{ width: '300px', padding: '40px 20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <label
          htmlFor="has-content-checkbox"
          style={{ color: 'white', marginRight: '10px' }}
        >
          Has Content:
        </label>
        <input
          id="has-content-checkbox"
          type="checkbox"
          checked={hasContent}
          onChange={(e) => setHasContent(e.target.checked)}
        />
      </div>

      <SendButton
        hasContent={hasContent}
        onClick={() => alert('Button clicked!')}
        disabled={false}
      />

      <div
        style={{
          marginTop: '20px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div>• Button style changes on hover</div>
        <div>• Tooltip appears on hover when content is present</div>
        <div>• Button turns green when content is present</div>
      </div>
    </div>
  )
}
