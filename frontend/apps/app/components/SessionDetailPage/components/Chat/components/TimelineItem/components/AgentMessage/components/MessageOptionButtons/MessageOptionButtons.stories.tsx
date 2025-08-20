import type { Meta, StoryObj } from '@storybook/react'
import { MessageOptionButtons } from '.'

const meta = {
  component: MessageOptionButtons,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  render: (args) => (
    <div style={{ width: '400px' }}>
      <MessageOptionButtons {...args} />
    </div>
  ),
} satisfies Meta<typeof MessageOptionButtons>

export default meta
type Story = StoryObj<typeof meta>

// MessageOptionButtons examples
export const OptionButtonsGroup: Story = {
  args: {
    options: [
      { id: '1', text: 'Option 1: Create a new table', disabled: false },
      { id: '2', text: 'Option 2: Modify existing schema', disabled: false },
      { id: '3', text: 'Option 3: Generate SQL queries', disabled: false },
    ],
  },
  name: 'MessageOptionButtons - Build',
}

// Multi-select MessageOptionButtons examples
export const OptionButtonsGroupMultiSelect: Story = {
  args: {
    options: [
      { id: '1', text: 'Option 1: Database design', disabled: false },
      { id: '2', text: 'Option 2: API implementation', disabled: false },
      { id: '3', text: 'Option 3: UI components', disabled: false },
    ],
    multiSelect: true,
  },
  name: 'MessageOptionButtons - Build Multi Select',
}
