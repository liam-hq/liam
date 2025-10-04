import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from './RadioGroup'

const RadioGroupExample = () => {
  const [value, setValue] = useState('option1')

  return (
    <RadioGroup value={value} onValueChange={setValue}>
      <RadioGroupItem value="option1" label="Option 1" />
      <RadioGroupItem value="option2" label="Option 2" />
      <RadioGroupItem value="option3" label="Option 3" />
    </RadioGroup>
  )
}

const meta = {
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component:
          'A Radix UI RadioGroup wrapper. Use RadioGroup and RadioGroupItem together to create radio button groups.',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
  render: () => <RadioGroupExample />,
}
