import type { Meta } from '@storybook/react'
import type { MessageOptionButtonProps } from './MessageOptionButton'
import { MessageOptionButton } from './MessageOptionButton'
import { MessageOptionButtons } from './MessageOptionButtons'

// Define the meta for the component
const meta: Meta<MessageOptionButtonProps> = {
  title: 'Components/Chat/MessageOptionButton',
  component: MessageOptionButton,
}

export default meta

// Individual MessageOptionButton examples
export const BuildDefault = () => (
  <MessageOptionButton
    text="Options for interacting with LLM during database design."
    isSelected={false}
    isDisabled={false}
  />
)

export const BuildSelected = () => (
  <MessageOptionButton
    text="Options for interacting with LLM during database design."
    isSelected={true}
    isDisabled={false}
  />
)

export const BuildDisabled = () => (
  <MessageOptionButton
    text="Options for interacting with LLM during database design."
    isSelected={false}
    isDisabled={true}
  />
)

// MessageOptionButtons examples
export const OptionButtonsGroup = () => (
  <div style={{ width: '400px' }}>
    <MessageOptionButtons
      options={[
        { id: '1', text: 'Option 1: Create a new table' },
        { id: '2', text: 'Option 2: Modify existing schema' },
        { id: '3', text: 'Option 3: Generate SQL queries' },
      ]}
    />
  </div>
)
OptionButtonsGroup.storyName = 'MessageOptionButtons - Build'

// Multi-select MessageOptionButtons examples
export const OptionButtonsGroupMultiSelect = () => (
  <div style={{ width: '400px' }}>
    <MessageOptionButtons
      options={[
        { id: '1', text: 'Option 1: Database design' },
        { id: '2', text: 'Option 2: API implementation' },
        { id: '3', text: 'Option 3: UI components' },
      ]}
      multiSelect={true}
    />
  </div>
)
OptionButtonsGroupMultiSelect.storyName =
  'MessageOptionButtons - Build Multi Select'
