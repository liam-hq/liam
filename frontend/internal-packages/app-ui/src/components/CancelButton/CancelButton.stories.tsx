import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import type { MouseEvent } from 'react'
import { useState } from 'react'
import { CancelButton } from './CancelButton'

const meta = {
  component: CancelButton,
  title: 'app-ui/CancelButton',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CancelButton>

export default meta

type Story = StoryObj<typeof meta>

// Default state (empty)
export const Default: Story = {
  args: {
    hasContent: false,
    onClick: () => {},
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state of the CancelButton when there is no content.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Button should be in default state
    await expect(button).toBeInTheDocument()
    await expect(button).not.toBeDisabled()
    await expect(button.className).toContain('default')
    await expect(button.className).not.toContain('canCancel')

    // Should not have data-loading attribute
    await expect(button).not.toHaveAttribute('data-loading')
  },
}

// With content
export const WithContent: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'CancelButton when there is content, showing the active red styling.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Button should be in canCancel state
    await expect(button).toBeInTheDocument()
    await expect(button).not.toBeDisabled()
    await expect(button.className).toContain('canCancel')
    await expect(button.className).not.toContain('default')

    // Should not have data-loading attribute
    await expect(button).not.toHaveAttribute('data-loading')
  },
}

// Hover state
export const Hover: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'CancelButton in hover state, showing the solid red background.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Simulate hover
    await userEvent.hover(button)

    // Button should maintain canCancel class
    await expect(button.className).toContain('canCancel')
  },
}

// With tooltip
export const WithTooltip: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'CancelButton with tooltip visible. The tooltip shows "Cancel" text when hasContent is true.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Hover to show tooltip
    await userEvent.hover(button)

    // Wait for tooltip to appear
    const tooltip = await canvas.findByText('Cancel')
    await expect(tooltip).toBeInTheDocument()
  },
}

// Disabled state
export const Disabled: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state of the CancelButton.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Button should be disabled
    await expect(button).toBeDisabled()
    await expect(button.className).toContain('canCancel')

    // Should have data-loading attribute
    await expect(button).toHaveAttribute('data-loading', 'true')
  },
}

// Loading state
export const Loading: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state of the CancelButton, showing the data-loading attribute styling.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Button should be disabled with data-loading
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('data-loading', 'true')
    await expect(button.className).toContain('canCancel')
  },
}

// Interactive demo
export const Interactive: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: false,
  },
  render: () => {
    const [clickCount, setClickCount] = useState(0)
    const [hasContent, setHasContent] = useState(true)
    const [isDisabled, setIsDisabled] = useState(false)

    const handleClick = () => {
      setClickCount((c) => c + 1)
      // Simulate cancelling operation
      setIsDisabled(true)
      setTimeout(() => {
        setHasContent(false)
        setIsDisabled(false)
      }, 1000)
    }

    return (
      <div style={{ textAlign: 'center' }}>
        <CancelButton
          hasContent={hasContent}
          onClick={handleClick}
          disabled={isDisabled}
        />
        <div style={{ marginTop: '20px', fontSize: '14px' }}>
          <p>Clicked: {clickCount} times</p>
          <p>Has Content: {hasContent ? 'Yes' : 'No'}</p>
          <p>Is Disabled: {isDisabled ? 'Yes' : 'No'}</p>
          <button
            type="button"
            onClick={() => setHasContent(true)}
            style={{ marginTop: '10px' }}
          >
            Reset Content
          </button>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive CancelButton that demonstrates state changes.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    const clickCounter = canvas.getByText(/Clicked: \d+ times/)
    const resetButton = canvas.getByText('Reset Content')

    // Initial state
    await expect(clickCounter).toHaveTextContent('Clicked: 0 times')
    await expect(button).not.toBeDisabled()
    await expect(button.className).toContain('canCancel')

    // Click button
    await userEvent.click(button)
    await expect(clickCounter).toHaveTextContent('Clicked: 1 times')
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('data-loading', 'true')

    // Wait for state to reset
    await new Promise((resolve) => setTimeout(resolve, 1100))
    await expect(button.className).toContain('default')
    await expect(button).not.toBeDisabled()
    await expect(button).not.toHaveAttribute('data-loading')

    // Reset content
    await userEvent.click(resetButton)
    await expect(button.className).toContain('canCancel')
  },
}

// Test onClick handler
export const WithClickHandler: Story = {
  args: {
    hasContent: true,
    onClick: () => {},
    disabled: false,
  },
  render: (args) => {
    const [clicks, setClicks] = useState(0)

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      setClicks((c) => c + 1)
    }

    return (
      <div>
        <CancelButton {...args} onClick={handleClick} />
        <p style={{ marginTop: '10px' }}>Clicks: {clicks}</p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    const counter = canvas.getByText(/Clicks: \d+/)

    // Initial state
    await expect(counter).toHaveTextContent('Clicks: 0')

    // Click button multiple times
    await userEvent.click(button)
    await expect(counter).toHaveTextContent('Clicks: 1')

    await userEvent.click(button)
    await expect(counter).toHaveTextContent('Clicks: 2')
  },
}

// Test no tooltip when hasContent is false
export const NoTooltipWhenNoContent: Story = {
  args: {
    hasContent: false,
    onClick: () => {},
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip should not appear when hasContent is false.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Hover button
    await userEvent.hover(button)

    // Wait a bit and check tooltip doesn't appear
    await new Promise((resolve) => setTimeout(resolve, 500))
    const tooltip = canvas.queryByText('Cancel')
    await expect(tooltip).not.toBeInTheDocument()
  },
}

// Test disabled without content
export const DisabledWithoutContent: Story = {
  args: {
    hasContent: false,
    onClick: () => {},
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state when there is no content.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Button should be disabled but not have data-loading
    await expect(button).toBeDisabled()
    await expect(button.className).toContain('default')
    await expect(button).not.toHaveAttribute('data-loading')
  },
}

// Test all state transitions
export const StateTransitions: Story = {
  args: {
    hasContent: false,
    onClick: () => {},
    disabled: false,
  },
  render: () => {
    const [hasContent, setHasContent] = useState(false)
    const [disabled, setDisabled] = useState(false)

    return (
      <div style={{ textAlign: 'center' }}>
        <CancelButton
          hasContent={hasContent}
          onClick={(e) => e.preventDefault()}
          disabled={disabled}
        />
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
          }}
        >
          <button type="button" onClick={() => setHasContent(!hasContent)}>
            Toggle Content
          </button>
          <button type="button" onClick={() => setDisabled(!disabled)}>
            Toggle Disabled
          </button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          <p>Has Content: {hasContent ? 'Yes' : 'No'}</p>
          <p>Disabled: {disabled ? 'Yes' : 'No'}</p>
          <p>data-loading: {hasContent && disabled ? 'true' : 'false'}</p>
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    const toggleContent = canvas.getByText('Toggle Content')
    const toggleDisabled = canvas.getByText('Toggle Disabled')

    // Test all combinations
    // 1. Default state (no content, enabled)
    await expect(button.className).toContain('default')
    await expect(button).not.toBeDisabled()
    await expect(button).not.toHaveAttribute('data-loading')

    // 2. With content, enabled
    await userEvent.click(toggleContent)
    await expect(button.className).toContain('canCancel')
    await expect(button).not.toBeDisabled()
    await expect(button).not.toHaveAttribute('data-loading')

    // 3. With content, disabled (loading state)
    await userEvent.click(toggleDisabled)
    await expect(button.className).toContain('canCancel')
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('data-loading', 'true')

    // 4. No content, disabled
    await userEvent.click(toggleContent)
    await expect(button.className).toContain('default')
    await expect(button).toBeDisabled()
    await expect(button).not.toHaveAttribute('data-loading')
  },
}
