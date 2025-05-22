import type { Meta, StoryObj } from '@storybook/react'
import { ProcessIndicator } from './ProcessIndicator'
import type { ProcessIndicatorProps } from './ProcessIndicator'

const meta: Meta<ProcessIndicatorProps> = {
  title: 'Components/Chat/ProcessIndicator',
  component: ProcessIndicator,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<ProcessIndicatorProps>

// Example of updating schema (expanded by default) - matches Figma design
export const UpdatingSchema: Story = {
  args: {
    status: 'processing',
    title: 'Updating schema...',
    subtitle: 'Wait while schema is being updated',
    progress: 40,
    primaryActionLabel: 'View Schema',
    secondaryActionLabel: 'Cancel',
    initialExpanded: true,
  },
}

// Example of creating table (collapsed by default)
export const CreatingTableCollapsed: Story = {
  args: {
    status: 'processing',
    title: 'Creating users table...',
    subtitle: 'Wait while table is being created',
    progress: 65,
    primaryActionLabel: 'View Table',
    secondaryActionLabel: 'Cancel',
    initialExpanded: false,
  },
}

// Example of completed state - matches Figma design
export const SchemaUpdateComplete: Story = {
  args: {
    status: 'complete',
    title: 'Schema Update Complete',
    subtitle: 'The schema has been successfully updated.',
    progress: 100,
    primaryActionLabel: 'View Schema',
    secondaryActionLabel: 'Cancel',
    initialExpanded: true,
  },
}

// Example of completed state (table)
export const TableCreationComplete: Story = {
  args: {
    status: 'complete',
    title: 'Table Creation Complete',
    primaryActionLabel: 'View Table',
  },
}

// Example with high progress
export const HighProgress: Story = {
  args: {
    status: 'processing',
    title: 'Optimizing database...',
    subtitle: 'This may take a few minutes',
    progress: 85,
    primaryActionLabel: 'View Details',
    secondaryActionLabel: 'Cancel',
  },
}

// Example with no buttons
export const NoActions: Story = {
  args: {
    status: 'processing',
    title: 'Running automated tests',
    subtitle: 'Testing database integrity',
    progress: 45,
  },
}

// Example with collapsed state (processing)
export const CollapsedStateProcessing: Story = {
  args: {
    status: 'processing',
    title: 'Analyzing database structure...',
    subtitle: 'Examining table relationships',
    progress: 50,
    primaryActionLabel: 'View Details',
    secondaryActionLabel: 'Cancel',
    initialExpanded: false,
  },
}

// Example with collapsed state (complete)
export const CollapsedStateComplete: Story = {
  args: {
    status: 'complete',
    title: 'Schema Update Complete',
    subtitle: 'The schema has been successfully updated.',
    progress: 100,
    primaryActionLabel: 'View Schema',
    secondaryActionLabel: 'Cancel',
    initialExpanded: false,
  },
}

// Example with long wrapping text
export const LongWrappingText: Story = {
  args: {
    status: 'processing',
    title:
      'This is a very long title that should wrap to multiple lines to test how the component handles text overflow and wrapping behavior',
    subtitle:
      'This is an extremely long subtitle with detailed information that would normally wrap to multiple lines in a real-world scenario when displaying complex status information to users',
    progress: 60,
    primaryActionLabel: 'View Details',
    secondaryActionLabel: 'Cancel',
    initialExpanded: true,
  },
}
