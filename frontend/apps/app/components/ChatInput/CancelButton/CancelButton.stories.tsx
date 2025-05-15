import type { Meta } from '@storybook/react'
import { CancelButton } from './CancelButton'

const meta = {
  component: CancelButton,
  title: 'Components/Chat/ChatInput/CancelButton',
} satisfies Meta<typeof CancelButton>

export default meta

// Default state (empty)
export const Default = {
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
export const WithContent = {
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
export const Hover = {
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
  play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // This is a play function that will be executed when the story is rendered
    // It simulates the hover state by adding a CSS class
    const button = canvasElement.querySelector('button')
    if (button) {
      button.classList.add('hover')
      // Add inline style to simulate hover
      button.style.backgroundColor = 'var(--danger-default)'
      button.style.color = 'var(--button-foreground)'
    }
  },
}

// With tooltip
export const WithTooltip = {
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
export const Disabled = {
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
export const Loading = {
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
  play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // This is a play function that will be executed when the story is rendered
    // It adds the data-loading attribute to the button to simulate the loading state
    const button = canvasElement.querySelector('button')
    if (button) {
      button.setAttribute('data-loading', 'true')
    }
  },
}

// Interactive demo
export const Interactive = {
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
