import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { SwitchRoot, SwitchThumb } from './Switch'

const SwitchExample = () => {
  const [checked, setChecked] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <SwitchRoot checked={checked} onCheckedChange={setChecked}>
        <SwitchThumb />
      </SwitchRoot>
      <span>{checked ? 'ON' : 'OFF'}</span>
    </div>
  )
}

const meta = {
  component: SwitchRoot,
  parameters: {
    docs: {
      description: {
        component:
          'A Radix UI Switch wrapper. Use SwitchRoot and SwitchThumb together to create a toggle switch.',
      },
    },
  },
} satisfies Meta<typeof SwitchRoot>

export default meta
type Story = StoryObj<typeof SwitchRoot>

export const Default: Story = {
  render: () => <SwitchExample />,
}
