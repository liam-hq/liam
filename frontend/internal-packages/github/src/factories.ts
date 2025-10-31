import type { Repository } from './types'

export const aRepository = (override?: Partial<Repository>): Repository => ({
  id: 123456789,
  node_id: 'MDEwOlJlcG9zaXRvcnkxMjM0NTY3ODk=',
  name: 'test-repo',
  full_name: 'test-owner/test-repo',
  owner: {
    login: 'test-owner',
    id: 987654321,
    node_id: 'MDQ6VXNlcjk4NzY1NDMyMQ==',
    avatar_url: 'https://avatars.githubusercontent.com/u/987654321?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/test-owner',
    html_url: 'https://github.com/test-owner',
    followers_url: 'https://api.github.com/users/test-owner/followers',
    following_url:
      'https://api.github.com/users/test-owner/following{/other_user}',
    gists_url: 'https://api.github.com/users/test-owner/gists{/gist_id}',
    starred_url:
      'https://api.github.com/users/test-owner/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/test-owner/subscriptions',
    organizations_url: 'https://api.github.com/users/test-owner/orgs',
    repos_url: 'https://api.github.com/users/test-owner/repos',
    events_url: 'https://api.github.com/users/test-owner/events{/privacy}',
    received_events_url:
      'https://api.github.com/users/test-owner/received_events',
    type: 'User',
    site_admin: false,
    ...override?.owner,
  },
  private: false,
  html_url: 'https://github.com/test-owner/test-repo',
  description: 'A test repository',
  fork: false,
  url: 'https://api.github.com/repos/test-owner/test-repo',
  archive_url:
    'https://api.github.com/repos/test-owner/test-repo/{archive_format}{/ref}',
  assignees_url:
    'https://api.github.com/repos/test-owner/test-repo/assignees{/user}',
  blobs_url:
    'https://api.github.com/repos/test-owner/test-repo/git/blobs{/sha}',
  branches_url:
    'https://api.github.com/repos/test-owner/test-repo/branches{/branch}',
  collaborators_url:
    'https://api.github.com/repos/test-owner/test-repo/collaborators{/collaborator}',
  comments_url:
    'https://api.github.com/repos/test-owner/test-repo/comments{/number}',
  commits_url:
    'https://api.github.com/repos/test-owner/test-repo/commits{/sha}',
  compare_url:
    'https://api.github.com/repos/test-owner/test-repo/compare/{base}...{head}',
  contents_url:
    'https://api.github.com/repos/test-owner/test-repo/contents/{+path}',
  contributors_url:
    'https://api.github.com/repos/test-owner/test-repo/contributors',
  deployments_url:
    'https://api.github.com/repos/test-owner/test-repo/deployments',
  downloads_url: 'https://api.github.com/repos/test-owner/test-repo/downloads',
  events_url: 'https://api.github.com/repos/test-owner/test-repo/events',
  forks_url: 'https://api.github.com/repos/test-owner/test-repo/forks',
  git_commits_url:
    'https://api.github.com/repos/test-owner/test-repo/git/commits{/sha}',
  git_refs_url:
    'https://api.github.com/repos/test-owner/test-repo/git/refs{/sha}',
  git_tags_url:
    'https://api.github.com/repos/test-owner/test-repo/git/tags{/sha}',
  git_url: 'git:github.com/test-owner/test-repo.git',
  issue_comment_url:
    'https://api.github.com/repos/test-owner/test-repo/issues/comments{/number}',
  issue_events_url:
    'https://api.github.com/repos/test-owner/test-repo/issues/events{/number}',
  issues_url:
    'https://api.github.com/repos/test-owner/test-repo/issues{/number}',
  keys_url: 'https://api.github.com/repos/test-owner/test-repo/keys{/key_id}',
  labels_url: 'https://api.github.com/repos/test-owner/test-repo/labels{/name}',
  languages_url: 'https://api.github.com/repos/test-owner/test-repo/languages',
  merges_url: 'https://api.github.com/repos/test-owner/test-repo/merges',
  milestones_url:
    'https://api.github.com/repos/test-owner/test-repo/milestones{/number}',
  notifications_url:
    'https://api.github.com/repos/test-owner/test-repo/notifications{?since,all,participating}',
  pulls_url: 'https://api.github.com/repos/test-owner/test-repo/pulls{/number}',
  releases_url:
    'https://api.github.com/repos/test-owner/test-repo/releases{/id}',
  ssh_url: 'git@github.com:test-owner/test-repo.git',
  stargazers_url:
    'https://api.github.com/repos/test-owner/test-repo/stargazers',
  statuses_url:
    'https://api.github.com/repos/test-owner/test-repo/statuses/{sha}',
  subscribers_url:
    'https://api.github.com/repos/test-owner/test-repo/subscribers',
  subscription_url:
    'https://api.github.com/repos/test-owner/test-repo/subscription',
  tags_url: 'https://api.github.com/repos/test-owner/test-repo/tags',
  teams_url: 'https://api.github.com/repos/test-owner/test-repo/teams',
  trees_url:
    'https://api.github.com/repos/test-owner/test-repo/git/trees{/sha}',
  clone_url: 'https://github.com/test-owner/test-repo.git',
  mirror_url: null,
  hooks_url: 'https://api.github.com/repos/test-owner/test-repo/hooks',
  svn_url: 'https://github.com/test-owner/test-repo',
  homepage: null,
  language: 'TypeScript',
  forks: 5,
  forks_count: 5,
  stargazers_count: 42,
  license: null,
  watchers: 42,
  watchers_count: 42,
  size: 1024,
  default_branch: 'main',
  open_issues: 3,
  open_issues_count: 3,
  is_template: false,
  topics: ['typescript', 'test'],
  has_issues: true,
  has_projects: true,
  has_wiki: true,
  has_pages: false,
  has_downloads: true,
  has_discussions: false,
  archived: false,
  disabled: false,
  visibility: 'public',
  pushed_at: '2025-01-15T10:30:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2025-01-15T10:30:00Z',
  permissions: {
    admin: true,
    maintain: true,
    push: true,
    triage: true,
    pull: true,
  },
  ...override,
})
