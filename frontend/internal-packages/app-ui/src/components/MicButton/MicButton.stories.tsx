import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { useState } from 'react'
import { MicButton } from './MicButton'

const meta = {
  title: 'app-ui/MicButton',
  component: MicButton,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MicButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    state: 'default',
  },
}

export const Hover: Story = {
  args: {
    state: 'hover',
  },
}

export const Active: Story = {
  args: {
    state: 'active',
  },
}

export const ActiveHover: Story = {
  args: {
    state: 'active-hover',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const WithPlayFunction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Voice Input' })

    // Initial state
    await expect(button).toBeInTheDocument()
    await expect(button).not.toBeDisabled()
    await expect(button).toHaveClass('state-default')

    // Hover state
    await userEvent.hover(button)
    await expect(button).toHaveClass('state-hover')

    // Click to activate
    await userEvent.click(button)
    await expect(button).toHaveClass('state-active')

    // Hover while active
    await userEvent.hover(button)
    await expect(button).toHaveClass('state-active-hover')

    // Unhover while active
    await userEvent.unhover(button)
    await expect(button).toHaveClass('state-active')

    // Click again to deactivate
    await userEvent.click(button)
    await expect(button).toHaveClass('state-default')
  },
}

export const DisabledInteraction: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Voice Input' })

    // Check disabled state
    await expect(button).toBeDisabled()
    await expect(button).toHaveClass('disabled')

    // Try to hover - should not change state
    await userEvent.hover(button)
    await expect(button).toHaveClass('state-default')
    await expect(button).toHaveClass('disabled')

    // Try to click - should not trigger
    await userEvent.click(button)
    await expect(button).toHaveClass('state-default')
    await expect(button).toHaveClass('disabled')
  },
}

export const WithClickHandler: Story = {
  render: () => {
    const [clickCount, setClickCount] = useState(0)

    return (
      <div style={{ textAlign: 'center' }}>
        <MicButton onClick={() => setClickCount((c) => c + 1)} />
        <p style={{ marginTop: '20px', color: '#ccc' }}>
          Clicked: {clickCount} times
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Voice Input' })
    const counter = canvas.getByText(/Clicked: \d+ times/)

    // Initial state
    await expect(counter).toHaveTextContent('Clicked: 0 times')

    // Click button
    await userEvent.click(button)
    await expect(counter).toHaveTextContent('Clicked: 1 times')

    // Click again
    await userEvent.click(button)
    await expect(counter).toHaveTextContent('Clicked: 2 times')
  },
}

export const Interactive = () => {
  const [isRecording, setIsRecording] = useState(false)

  const handleClick = () => {
    setIsRecording(!isRecording)
  }

  return (
    <div style={{ padding: '40px', minHeight: '200px' }}>
      <MicButton onClick={handleClick} />
      <div style={{ marginTop: '40px', color: '#ccc', fontSize: '14px' }}>
        <p>
          Recording:{' '}
          <strong style={{ color: isRecording ? '#1ded83' : '#666' }}>
            {isRecording ? 'Yes' : 'No'}
          </strong>
        </p>
        <ul style={{ marginTop: '20px', lineHeight: '1.8' }}>
          <li>Hover over the button to see hover state</li>
          <li>Click to toggle recording on/off</li>
          <li>The button manages its own visual state automatically</li>
        </ul>
      </div>
    </div>
  )
}
