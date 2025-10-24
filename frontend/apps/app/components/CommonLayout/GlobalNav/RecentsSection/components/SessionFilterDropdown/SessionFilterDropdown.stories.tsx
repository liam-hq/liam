import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import type { SessionFilterType } from '../../types'
import {
  type OrganizationMember,
  SessionFilterDropdown,
} from './SessionFilterDropdown'

const meta: Meta<typeof SessionFilterDropdown> = {
  title: 'App/SessionFilterDropdown',
  component: SessionFilterDropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SessionFilterDropdown>

const mockOrganizationMembers: OrganizationMember[] = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    email: 'bob@example.com',
  },
  {
    id: 'user-3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
  },
  {
    id: 'user-4',
    name: 'Diana Prince',
    email: 'diana@example.com',
  },
]

const SessionFilterDropdownWithState = (
  props: Omit<
    React.ComponentProps<typeof SessionFilterDropdown>,
    'filterType' | 'onFilterChange'
  > & {
    initialFilterType?: SessionFilterType
  },
) => {
  const [filterType, setFilterType] = useState<SessionFilterType>(
    props.initialFilterType || 'me',
  )

  return (
    <div style={{ width: '240px' }}>
      <SessionFilterDropdown
        {...props}
        filterType={filterType}
        onFilterChange={(newFilter) => setFilterType(newFilter)}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <SessionFilterDropdownWithState
      organizationMembers={mockOrganizationMembers}
      currentUserId="user-1"
    />
  ),
}

export const AllSessionsSelected: Story = {
  render: () => (
    <SessionFilterDropdownWithState
      organizationMembers={mockOrganizationMembers}
      currentUserId="user-1"
      initialFilterType="all"
    />
  ),
}

export const SpecificUserSelected: Story = {
  render: () => (
    <SessionFilterDropdownWithState
      organizationMembers={mockOrganizationMembers}
      currentUserId="user-1"
      initialFilterType="user-2"
    />
  ),
}

export const SingleMember: Story = {
  render: () => (
    <SessionFilterDropdownWithState
      organizationMembers={[
        {
          id: 'user-1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
        },
      ]}
      currentUserId="user-1"
    />
  ),
}

export const ManyMembers: Story = {
  render: () => (
    <SessionFilterDropdownWithState
      organizationMembers={[
        ...mockOrganizationMembers,
        {
          id: 'user-5',
          name: 'Eve Anderson',
          email: 'eve@example.com',
        },
        {
          id: 'user-6',
          name: 'Frank Miller',
          email: 'frank@example.com',
        },
        {
          id: 'user-7',
          name: 'Grace Lee',
          email: 'grace@example.com',
        },
        {
          id: 'user-8',
          name: 'Henry Wilson',
          email: 'henry@example.com',
        },
      ]}
      currentUserId="user-1"
    />
  ),
}
