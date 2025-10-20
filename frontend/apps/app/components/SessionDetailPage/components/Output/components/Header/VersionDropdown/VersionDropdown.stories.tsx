import type { Meta, StoryObj } from '@storybook/nextjs'
import type { Version } from '../../../../../types'
import { VersionDropdown } from './VersionDropdown'

const sampleVersions: Version[] = [
  {
    id: 'v1',
    number: 1,
    building_schema_id: 'schema-1',
    patch: [],
    reverse_patch: [],
  },
  {
    id: 'v2',
    number: 2,
    building_schema_id: 'schema-1',
    patch: [],
    reverse_patch: [],
  },
  {
    id: 'v3',
    number: 3,
    building_schema_id: 'schema-1',
    patch: [],
    reverse_patch: [],
  },
  {
    id: 'v4',
    number: 4,
    building_schema_id: 'schema-1',
    patch: [],
    reverse_patch: [],
  },
]

const meta = {
  component: VersionDropdown,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    versions: {
      description: 'List of available versions',
    },
    selectedVersion: {
      description: 'Currently selected version',
    },
    onSelectedVersionChange: {
      action: 'version changed',
      description: 'Callback when version is changed',
    },
  },
} satisfies Meta<typeof VersionDropdown>

export default meta
type Story = StoryObj<typeof VersionDropdown>

export const Default: Story = {
  args: {
    versions: sampleVersions,
    selectedVersion: sampleVersions[3],
  },
}

export const FirstVersion: Story = {
  args: {
    versions: sampleVersions,
    selectedVersion: sampleVersions[0],
  },
}

export const NoVersions: Story = {
  args: {
    versions: [],
    selectedVersion: null,
  },
}

export const Disabled: Story = {
  args: {
    versions: undefined,
    selectedVersion: null,
  },
}
