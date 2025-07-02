import type { Meta } from '@storybook/nextjs'
import { useState } from 'react'
import { DeepModelingToggle } from './DeepModelingToggle'

const meta = {
  title: 'Features/Sessions/DeepModelingToggle',
  component: DeepModelingToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeepModelingToggle>

export default meta

export const Default = {
  args: {
    isActive: false,
    children: 'Deep Modeling',
  },
}

export const Active = {
  args: {
    isActive: true,
    children: 'Deep Modeling',
  },
}

export const Interactive = () => {
  const [isActive, setIsActive] = useState(false)

  return (
    <DeepModelingToggle
      isActive={isActive}
      onClick={() => setIsActive(!isActive)}
    >
      Deep Modeling
    </DeepModelingToggle>
  )
}
