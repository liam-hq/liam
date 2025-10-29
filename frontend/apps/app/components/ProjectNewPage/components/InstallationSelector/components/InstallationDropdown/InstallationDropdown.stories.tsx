import type { Installation } from '@liam-hq/github'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { InstallationDropdown } from './InstallationDropdown'

const mockInstallation1: Installation = {
  id: 1,
  account: {
    login: 'example-org',
    id: 100,
    node_id: 'MDEyOk9yZ2FuaXphdGlvbjEwMA==',
    avatar_url: 'https://avatars.githubusercontent.com/u/100?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/example-org',
    html_url: 'https://github.com/example-org',
    followers_url: 'https://api.github.com/users/example-org/followers',
    following_url:
      'https://api.github.com/users/example-org/following{/other_user}',
    gists_url: 'https://api.github.com/users/example-org/gists{/gist_id}',
    starred_url:
      'https://api.github.com/users/example-org/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/example-org/subscriptions',
    organizations_url: 'https://api.github.com/users/example-org/orgs',
    repos_url: 'https://api.github.com/users/example-org/repos',
    events_url: 'https://api.github.com/users/example-org/events{/privacy}',
    received_events_url:
      'https://api.github.com/users/example-org/received_events',
    type: 'Organization',
    site_admin: false,
  },
  access_tokens_url: 'https://api.github.com/app/installations/1/access_tokens',
  repositories_url: 'https://api.github.com/installation/repositories',
  html_url: 'https://github.com/settings/installations/1',
  app_id: 123456,
  app_slug: 'liam-app',
  target_id: 100,
  target_type: 'Organization',
  permissions: {
    metadata: 'read',
    contents: 'read',
  },
  events: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  single_file_name: null,
  repository_selection: 'all',
  suspended_by: null,
  suspended_at: null,
}

const mockInstallation2: Installation = {
  id: 2,
  account: {
    login: 'personal-user',
    id: 200,
    node_id: 'MDQ6VXNlcjIwMA==',
    avatar_url: 'https://avatars.githubusercontent.com/u/200?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/personal-user',
    html_url: 'https://github.com/personal-user',
    followers_url: 'https://api.github.com/users/personal-user/followers',
    following_url:
      'https://api.github.com/users/personal-user/following{/other_user}',
    gists_url: 'https://api.github.com/users/personal-user/gists{/gist_id}',
    starred_url:
      'https://api.github.com/users/personal-user/starred{/owner}{/repo}',
    subscriptions_url:
      'https://api.github.com/users/personal-user/subscriptions',
    organizations_url: 'https://api.github.com/users/personal-user/orgs',
    repos_url: 'https://api.github.com/users/personal-user/repos',
    events_url: 'https://api.github.com/users/personal-user/events{/privacy}',
    received_events_url:
      'https://api.github.com/users/personal-user/received_events',
    type: 'User',
    site_admin: false,
  },
  access_tokens_url: 'https://api.github.com/app/installations/2/access_tokens',
  repositories_url: 'https://api.github.com/installation/repositories',
  html_url: 'https://github.com/settings/installations/2',
  app_id: 123456,
  app_slug: 'liam-app',
  target_id: 200,
  target_type: 'User',
  permissions: {
    metadata: 'read',
    contents: 'read',
  },
  events: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  single_file_name: null,
  repository_selection: 'selected',
  suspended_by: null,
  suspended_at: null,
}

const mockInstallation3: Installation = {
  id: 3,
  account: {
    login: 'team-workspace',
    id: 300,
    node_id: 'MDEyOk9yZ2FuaXphdGlvbjMwMA==',
    avatar_url: 'https://avatars.githubusercontent.com/u/300?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/team-workspace',
    html_url: 'https://github.com/team-workspace',
    followers_url: 'https://api.github.com/users/team-workspace/followers',
    following_url:
      'https://api.github.com/users/team-workspace/following{/other_user}',
    gists_url: 'https://api.github.com/users/team-workspace/gists{/gist_id}',
    starred_url:
      'https://api.github.com/users/team-workspace/starred{/owner}{/repo}',
    subscriptions_url:
      'https://api.github.com/users/team-workspace/subscriptions',
    organizations_url: 'https://api.github.com/users/team-workspace/orgs',
    repos_url: 'https://api.github.com/users/team-workspace/repos',
    events_url: 'https://api.github.com/users/team-workspace/events{/privacy}',
    received_events_url:
      'https://api.github.com/users/team-workspace/received_events',
    type: 'Organization',
    site_admin: false,
  },
  access_tokens_url: 'https://api.github.com/app/installations/3/access_tokens',
  repositories_url: 'https://api.github.com/installation/repositories',
  html_url: 'https://github.com/settings/installations/3',
  app_id: 123456,
  app_slug: 'liam-app',
  target_id: 300,
  target_type: 'Organization',
  permissions: {
    metadata: 'read',
    contents: 'read',
  },
  events: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  single_file_name: null,
  repository_selection: 'all',
  suspended_by: null,
  suspended_at: null,
}

const mockInstallations: Installation[] = [
  mockInstallation1,
  mockInstallation2,
  mockInstallation3,
]

const meta = {
  component: InstallationDropdown,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    installations: {
      description: 'Array of GitHub installations',
    },
    selectedLabel: {
      control: 'text',
      description: 'Label shown in the dropdown trigger',
    },
    onSelect: {
      action: 'installation selected',
      description: 'Callback when an installation is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the dropdown is disabled',
    },
  },
} satisfies Meta<typeof InstallationDropdown>

export default meta
type Story = StoryObj<typeof InstallationDropdown>

export const Default: Story = {
  args: {
    installations: mockInstallations,
    selectedLabel: 'Select an account',
    disabled: false,
  },
}

export const WithSelection: Story = {
  args: {
    installations: mockInstallations,
    selectedLabel: 'example-org',
    disabled: false,
  },
}

export const SingleInstallation: Story = {
  args: {
    installations: [mockInstallation1],
    selectedLabel: 'example-org',
    disabled: false,
  },
}

export const Disabled: Story = {
  args: {
    installations: mockInstallations,
    selectedLabel: 'Select an account',
    disabled: true,
  },
}

export const EmptyInstallations: Story = {
  args: {
    installations: [],
    selectedLabel: 'No accounts available',
    disabled: true,
  },
}
