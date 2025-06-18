export type RouteDefinitions = {
  login: string
  projects: string
  'projects/new': string
  'projects/[projectId]': (params: { projectId: string }) => string
  'organizations/new': string
  organizations: string
  'settings/general': string
  'settings/members': string
  'settings/billing': string
  'settings/projects': string
  'design_sessions/new': string
  'invitations/tokens/[token]': (params: { token: string }) => string
  'projects/[projectId]/ref/[branchOrCommit]': (params: {
    projectId: string
    branchOrCommit: string
  }) => string
  'projects/[projectId]/ref/[branchOrCommit]/sessions': (params: {
    projectId: string
    branchOrCommit: string
  }) => string
  'projects/[projectId]/ref/[branchOrCommit]/schema': (params: {
    projectId: string
    branchOrCommit: string
  }) => string
  'projects/[projectId]/ref/[branchOrCommit]/schema/[...schemaFilePath]': (params: {
    projectId: string
    branchOrCommit: string
    schemaFilePath: string
  }) => string
  'design_sessions/[id]': (params: { id: string }) => string
}

export const routeDefinitions: RouteDefinitions = {
  login: '/app/login',
  projects: '/app/projects',
  'projects/new': '/app/projects/new',
  'organizations/new': '/app/organizations/new',
  organizations: '/app/organizations',
  'settings/general': '/app/settings/general',
  'settings/members': '/app/settings/members',
  'settings/billing': '/app/settings/billing',
  'settings/projects': '/app/settings/projects',
  'design_sessions/new': '/app/design_sessions/new',
  'invitations/tokens/[token]': ({ token }) => {
    return `/app/invitations/tokens/${token}`
  },
  'projects/[projectId]': ({ projectId }) => {
    return `/app/projects/${projectId}`
  },
  'projects/[projectId]/ref/[branchOrCommit]': ({
    projectId,
    branchOrCommit,
  }) => {
    const encodedBranchOrCommit = encodeURIComponent(branchOrCommit)
    return `/app/projects/${projectId}/ref/${encodedBranchOrCommit}`
  },
  'projects/[projectId]/ref/[branchOrCommit]/sessions': ({
    projectId,
    branchOrCommit,
  }) => {
    const encodedBranchOrCommit = encodeURIComponent(branchOrCommit)
    return `/app/projects/${projectId}/ref/${encodedBranchOrCommit}/sessions`
  },
  'projects/[projectId]/ref/[branchOrCommit]/schema/[...schemaFilePath]': ({
    projectId,
    branchOrCommit,
    schemaFilePath,
  }) => {
    const encodedBranchOrCommit = encodeURIComponent(branchOrCommit)
    return `/app/projects/${projectId}/ref/${encodedBranchOrCommit}/schema/${schemaFilePath}`
  },
  'projects/[projectId]/ref/[branchOrCommit]/schema': ({
    projectId,
    branchOrCommit,
  }) => {
    const encodedBranchOrCommit = encodeURIComponent(branchOrCommit)
    return `/app/projects/${projectId}/ref/${encodedBranchOrCommit}/schema`
  },
  'design_sessions/[id]': ({ id }) => {
    return `/app/design_sessions/${id}`
  },
} as const
