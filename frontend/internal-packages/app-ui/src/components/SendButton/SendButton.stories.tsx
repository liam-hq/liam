import type { Meta, StoryObj } from '@storybook/nextjs'
import { expect, userEvent, within } from '@storybook/test'
import { useState } from 'react'
import { SendButton } from './SendButton'

const meta = {
  component: SendButton,
  title: 'app-ui/SendButton',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Verify button is disabled when no content
    await expect(button).toBeDisabled()
    await expect(button).toHaveClass('default')

    // Verify tooltip is not visible
    const tooltip = canvas.queryByText('Send')
    await expect(tooltip).not.toBeInTheDocument()
  },
}

// Can send state (with content)
export const CanSend: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: false,
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Verify button is enabled with content
    await expect(button).not.toBeDisabled()
    await expect(button).toHaveClass('canSend')

    // Hover to show tooltip
    await userEvent.hover(button)

    // Wait for tooltip to appear
    const tooltip = await canvas.findByText('Send')
    await expect(tooltip).toBeInTheDocument()

    // Click the button
    await userEvent.click(button)
    // Button should still be enabled after click
    await expect(button).not.toBeDisabled()
  },
}

// Disabled state (loading)
export const Disabled: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: true,
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Verify button is disabled
    await expect(button).toBeDisabled()
    // Verify loading state
    await expect(button).toHaveAttribute('data-loading', 'true')

    // Verify tooltip is not shown when disabled
    await userEvent.hover(button)
    const tooltip = canvas.queryByText('Send')
    await expect(tooltip).not.toBeInTheDocument()
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

// Test click events
export const ClickHandling: Story = {
  args: {
    hasContent: true,
    disabled: false,
    onClick: () => {},
  },
  render: function Render(args) {
    const [clickCount, setClickCount] = useState(0)

    return (
      <div style={{ textAlign: 'center' }}>
        <SendButton
          {...args}
          onClick={(e) => {
            e.preventDefault()
            setClickCount((count) => count + 1)
          }}
        />
        <div style={{ marginTop: '16px', color: 'white' }}>
          Clicked: <span data-testid="click-count">{clickCount}</span> times
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    const counter = canvas.getByTestId('click-count')

    // Initial state
    await expect(counter).toHaveTextContent('0')

    // Click button multiple times
    await userEvent.click(button)
    await expect(counter).toHaveTextContent('1')

    await userEvent.click(button)
    await expect(counter).toHaveTextContent('2')

    // Verify preventDefault works
    const form = document.createElement('form')
    form.appendChild(button)
    let formSubmitted = false
    form.onsubmit = () => {
      formSubmitted = true
    }

    await userEvent.click(button)
    await expect(formSubmitted).toBe(false)
  },
}

// Test state transitions
export const StateTransitions: Story = {
  args: {
    hasContent: false,
    disabled: false,
    onClick: () => {},
  },
  render: function Render() {
    const [hasContent, setHasContent] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSend = () => {
      if (hasContent && !isLoading) {
        setIsLoading(true)
        setTimeout(() => {
          setIsLoading(false)
          setHasContent(false)
        }, 1500)
      }
    }

    return (
      <div style={{ width: '300px' }}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Type to enable send..."
            onChange={(e) => setHasContent(e.target.value.length > 0)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              background: '#222',
              color: 'white',
            }}
            data-testid="text-input"
          />
        </div>
        <SendButton
          hasContent={hasContent}
          onClick={handleSend}
          disabled={isLoading}
        />
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
          {isLoading ? 'Sending...' : 'Type and click send'}
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    const input = canvas.getByTestId('text-input')

    // Initial state - button disabled
    await expect(button).toBeDisabled()
    await expect(button).toHaveClass('default')

    // Type text - button enabled
    await userEvent.type(input, 'Hello world')
    await expect(button).not.toBeDisabled()
    await expect(button).toHaveClass('canSend')

    // Click send - button becomes loading state
    await userEvent.click(button)
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('data-loading', 'true')

    // Wait for loading to complete
    await new Promise((resolve) => setTimeout(resolve, 1600))
    await expect(button).toBeDisabled()
    await expect(button).toHaveClass('default')
    await expect(input).toHaveValue('')
  },
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
