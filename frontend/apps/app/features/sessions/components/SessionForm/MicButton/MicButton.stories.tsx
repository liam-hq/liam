import type { Meta } from '@storybook/nextjs'
import { useState } from 'react'
import { MicButton } from './MicButton'

const meta = {
  title: 'Features/Sessions/MicButton',
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

export const Default = {
  args: {
    state: 'default',
  },
}

export const Hover = {
  args: {
    state: 'hover',
  },
}

export const Active = {
  args: {
    state: 'active',
  },
}

export const ActiveHover = {
  args: {
    state: 'active-hover',
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
