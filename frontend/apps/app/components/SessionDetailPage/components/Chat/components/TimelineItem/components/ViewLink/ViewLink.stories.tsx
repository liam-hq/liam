import type { Meta, StoryObj } from '@storybook/nextjs'
import { ViewLink } from './ViewLink'

const meta = {
  component: ViewLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof ViewLink>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    text: 'View Artifact',
    ariaLabel: 'Navigate to artifact view',
  },
}

export const WithCustomText: Story = {
  args: {
    text: 'View Details',
    ariaLabel: 'Navigate to details view',
  },
}

export const ToTestCasesSection: Story = {
  args: {
    text: 'View Test Cases',
    ariaLabel: 'Navigate to test cases tab',
  },
  parameters: {
    docs: {
      description: {
        story: 'Link to navigate to Test Cases section in Artifact tab',
      },
    },
  },
}

export const ToERDTab: Story = {
  args: {
    text: 'View ERD',
    ariaLabel: 'Navigate to ERD tab',
  },
  parameters: {
    docs: {
      description: {
        story: 'Link to navigate to ERD tab',
      },
    },
  },
}

export const ToUpdateSchemaTab: Story = {
  args: {
    text: 'View Schema Updates',
    ariaLabel: 'Navigate to update schema tab',
  },
  parameters: {
    docs: {
      description: {
        story: 'Link to navigate to Update Schema tab',
      },
    },
  },
}

export const ToSpecificIssue: Story = {
  args: {
    text: 'View Issue Details',
    ariaLabel: 'Navigate to issue details in update schema tab',
  },
  parameters: {
    docs: {
      description: {
        story: 'Link to navigate to a specific issue within Update Schema tab',
      },
    },
  },
}

export const WithClickHandler: Story = {
  args: {
    text: 'Click Me',
    ariaLabel: 'Custom action button',
    onClick: () => {
      // Handle click event
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with a custom click handler',
      },
    },
  },
}
