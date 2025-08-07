import type { Meta, StoryObj } from '@storybook/react'
import { VersionProvider } from '@/providers'
import { ErdRendererProvider } from '@/providers/ErdRendererProvider'
import { ERDRenderer } from '../ErdRenderer'
import {
  basicSchema,
  createDiffData,
  currentSchemaForDiff,
  mockVersion,
  previousSchemaForDiff,
} from './fixtures/schemas'

const meta: Meta<typeof ERDRenderer> = {
  title: 'erd-core/ERDRenderer',
  component: ERDRenderer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'ERDRenderer is the main component for displaying Entity-Relationship Diagrams with support for diff visualization.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => {
      return (
        <div style={{ height: '100vh', width: '100vw' }}>
          <VersionProvider version={mockVersion}>
            <ErdRendererProvider
              schema={{ current: basicSchema }}
              showDiff={false}
              defaultShowMode="ALL_FIELDS"
            >
              <Story />
            </ErdRendererProvider>
          </VersionProvider>
        </div>
      )
    },
  ],
  argTypes: {
    defaultSidebarOpen: {
      control: 'boolean',
      description: 'Whether the sidebar is open by default',
    },
    withAppBar: {
      control: 'boolean',
      description: 'Whether to show the app bar',
    },
  },
}

export default meta
type Story = StoryObj<typeof ERDRenderer>

export const Default: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic ERD display without diff mode. Shows a simple schema with users and posts tables.',
      },
    },
  },
}

export const WithAppBar: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'ERD display with app bar showing additional controls and branding.',
      },
    },
  },
}

export const DiffMode: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: false,
  },
  decorators: [
    (Story: React.ComponentType) => {
      const diffData = createDiffData(
        currentSchemaForDiff,
        previousSchemaForDiff,
      )

      return (
        <div style={{ height: '100vh', width: '100vw' }}>
          <VersionProvider version={mockVersion}>
            <ErdRendererProvider
              schema={diffData}
              showDiff={true}
              defaultShowMode="ALL_FIELDS"
            >
              <Story />
            </ErdRendererProvider>
          </VersionProvider>
        </div>
      )
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'ERD in diff mode showing changes between two schema versions. Green indicates additions, red indicates removals, yellow indicates modifications.',
      },
    },
  },
}

export const DiffModeWithAppBar: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: true,
  },
  decorators: [
    (Story: React.ComponentType) => {
      const diffData = createDiffData(
        currentSchemaForDiff,
        previousSchemaForDiff,
      )

      return (
        <div style={{ height: '100vh', width: '100vw' }}>
          <VersionProvider version={mockVersion}>
            <ErdRendererProvider
              schema={diffData}
              showDiff={true}
              defaultShowMode="ALL_FIELDS"
            >
              <Story />
            </ErdRendererProvider>
          </VersionProvider>
        </div>
      )
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'ERD in diff mode with app bar, showing the complete interface for schema comparison.',
      },
    },
  },
}

export const SidebarClosed: Story = {
  args: {
    defaultSidebarOpen: false,
    withAppBar: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'ERD with sidebar closed by default, focusing on the diagram visualization.',
      },
    },
  },
}

export const ErrorState: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: false,
    errorObjects: [
      {
        name: 'SampleError',
        message: 'Sample error message for testing',
      },
      {
        name: 'AnotherError',
        message: 'Another error to demonstrate multiple errors',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'ERD showing error state when there are issues with the schema or rendering.',
      },
    },
  },
}
