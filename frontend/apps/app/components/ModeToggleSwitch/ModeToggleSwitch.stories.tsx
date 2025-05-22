import { type ComponentProps, useState } from 'react'
import { ModeToggleSwitch } from './ModeToggleSwitch'

export default {
  title: 'Components/Chat/ModeToggleSwitch',
  component: ModeToggleSwitch,
  tags: ['autodocs'],
}

export const Uncontrolled = (args: ComponentProps<typeof ModeToggleSwitch>) => (
  <ModeToggleSwitch {...args} />
)

export const Controlled = (args: ComponentProps<typeof ModeToggleSwitch>) => {
  const [mode, setMode] = useState<'ask' | 'build'>('ask')
  return <ModeToggleSwitch {...args} value={mode} onChange={setMode} />
}

export const AskActive = (args: ComponentProps<typeof ModeToggleSwitch>) => (
  <ModeToggleSwitch {...args} value="ask" />
)

export const BuildActive = (args: ComponentProps<typeof ModeToggleSwitch>) => (
  <ModeToggleSwitch {...args} value="build" />
)
