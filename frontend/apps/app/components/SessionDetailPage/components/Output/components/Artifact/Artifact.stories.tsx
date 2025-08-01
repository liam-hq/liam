import type { Meta, StoryObj } from '@storybook/react'
import { Artifact } from './Artifact'
import {
  artifactWithErrors,
  artifactWithoutExecutionLogs,
  artifactWithRequirements,
  complexHierarchyArtifact,
  fullExampleArtifact,
  minimalArtifact,
} from './mockData'
import { formatArtifactToMarkdown } from './utils/formatArtifactToMarkdown'

const meta = {
  component: Artifact,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0a0a0a', // Approximate dark background color
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          height: '100vh',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Artifact>

export default meta
type Story = StoryObj<typeof meta>

export const Minimal: Story = {
  name: 'Minimal Display',
  args: {
    doc: formatArtifactToMarkdown(minimalArtifact),
  },
}

export const WithRequirements: Story = {
  name: 'Requirements Only (No Use Cases)',
  args: {
    doc: formatArtifactToMarkdown(artifactWithRequirements),
  },
}

export const FullExample: Story = {
  name: 'Full Example (Requirements, Use Cases, Execution Results)',
  args: {
    doc: formatArtifactToMarkdown(fullExampleArtifact),
  },
}

export const WithErrors: Story = {
  name: 'With Execution Errors',
  args: {
    doc: formatArtifactToMarkdown(artifactWithErrors),
  },
}

export const ComplexHierarchy: Story = {
  name: 'Complex Hierarchy',
  args: {
    doc: formatArtifactToMarkdown(complexHierarchyArtifact),
  },
}

export const WithoutExecutionLogs: Story = {
  name: 'Without Execution Logs',
  args: {
    doc: formatArtifactToMarkdown(artifactWithoutExecutionLogs),
  },
}
