import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { type Branch, BranchCombobox } from './BranchCombobox'

const sampleBranches: Branch[] = [
  { name: 'main', sha: '123abc', isProduction: true },
  { name: 'develop', sha: '456def', isProduction: false },
  { name: 'feature/user-authentication', sha: '789ghi', isProduction: false },
  { name: 'feature/database-migration', sha: '012jkl', isProduction: false },
]

const meta = {
  component: BranchCombobox,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    branches: { description: 'List of available branches' },
    selectedBranchSha: { control: 'text', description: 'Selected branch SHA' },
    onBranchChange: { action: 'branch-change', description: 'Change handler' },
    disabled: { control: 'boolean', description: 'Disable interaction' },
    isLoading: { control: 'boolean', description: 'Loading state' },
  },
  args: {
    branches: sampleBranches,
    selectedBranchSha: '123abc',
  },
} satisfies Meta<typeof BranchCombobox>

export default meta
type Story = StoryObj<typeof BranchCombobox>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
}

export const WithError: Story = {
  args: {
    selectedBranchSha: undefined,
    isError: true,
  },
}

export const EmptyBranches: Story = {
  args: {
    branches: [],
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string | undefined>(
      args.selectedBranchSha ?? sampleBranches[0]?.sha,
    )
    return (
      <BranchCombobox
        {...args}
        branches={args.branches ?? sampleBranches}
        selectedBranchSha={selected}
        onBranchChange={setSelected}
      />
    )
  },
  args: {
    branches: sampleBranches,
  },
}
