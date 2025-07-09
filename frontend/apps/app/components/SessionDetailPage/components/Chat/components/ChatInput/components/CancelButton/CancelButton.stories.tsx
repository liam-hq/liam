import type { Meta, StoryObj } from '@storybook/react'
import { CancelButton } from './CancelButton'

const meta = {
  component: CancelButton,
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
}

// Interactive demo
export const Interactive: Story = {
  args: {
    hasContent: true,
    onClick: () => {
      alert('Cancel button clicked')
    },
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive CancelButton that shows an alert when clicked.',
      },
    },
  },
}
