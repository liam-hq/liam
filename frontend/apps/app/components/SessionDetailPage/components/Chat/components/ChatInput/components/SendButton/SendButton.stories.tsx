import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { SendButton } from './SendButton'

const meta = {
  component: SendButton,
} satisfies Meta<typeof SendButton>

export default meta
type Story = StoryObj<typeof meta>

// Default state (no content)
export const Default: Story = {
  args: {
    hasContent: false,
    onClick: () => {},
    disabled: false,
  },
}

// Can send state (with content)
export const CanSend: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: false,
  },
}

// Disabled state
export const Disabled: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: true,
  },
}

// With tooltip visible
export const WithTooltip: Story = {
  args: {
    hasContent: true,
    disabled: false,
    onClick: () => {},
  },
  render: (args) => {
    return (
      <div style={{ padding: '40px 20px' }}>
        {/* Added extra padding to ensure tooltip is visible in Storybook */}
        <div style={{ paddingTop: '30px' }}>
          <SendButton {...args} />
        </div>
      </div>
    )
  },
}

// Interactive demo
export const Interactive: Story = {
  args: {
    hasContent: false,
    disabled: false,
    onClick: () => alert('Button clicked!'),
  },
  render: ({ hasContent: initialHasContent, ...args }) => {
    const [hasContent, setHasContent] = useState(initialHasContent)

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

        <SendButton {...args} hasContent={hasContent} />

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
  },
}
