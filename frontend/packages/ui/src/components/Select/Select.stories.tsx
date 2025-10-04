import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './Select'

const SelectExample = () => {
  const [value, setValue] = useState('apple')

  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger style={{ width: '200px' }}>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

const SelectWithSeparatorExample = () => {
  const [value, setValue] = useState('')

  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger style={{ width: '200px' }}>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Common</SelectLabel>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Advanced</SelectLabel>
          <SelectItem value="option3">Option 3</SelectItem>
          <SelectItem value="option4">Option 4</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

const meta = {
  component: Select,
  parameters: {
    docs: {
      description: {
        component:
          'A Radix UI Select wrapper. Use Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem, and SelectSeparator together.',
      },
    },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => <SelectExample />,
}

export const WithGroups: Story = {
  render: () => <SelectWithSeparatorExample />,
}
