import { ROUTE_PREFIXES } from './constants'

export type RouteDefinitions = {
  login: string
  error: string
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
  'public/design_sessions/[id]': (params: { id: string }) => string
}

export const routeDefinitions: RouteDefinitions = {
  login: '/login',
  error: '/error',
  projects: '/projects',
  'projects/new': '/projects/new',
  'organizations/new': '/organizations/new',
  organizations: '/organizations',
  'settings/general': '/settings/general',
  'settings/members': '/settings/members',
  'settings/billing': '/settings/billing',
  'settings/projects': '/settings/projects',
  'design_sessions/new': '/design_sessions/new',
  'invitations/tokens/[token]': ({ token }) => {
    return `/invitations/tokens/${token}`
  },
  'projects/[projectId]': ({ projectId }) => {
    return `/projects/${projectId}`
  },
  'projects/[projectId]/ref/[branchOrCommit]': ({
    projectId,
    branchOrCommit,
  }) => {
    const encodedBranchOrCommit = encodeURIComponent(branchOrCommit)
    return `/projects/${projectId}/ref/${encodedBranchOrCommit}`
  },
  'projects/[projectId]/ref/[branchOrCommit]/sessions': ({
    projectId,
    branchOrCommit,
  }) => {
    const encodedBranchOrCommit = encodeURIComponent(branchOrCommit)
    return `/projects/${projectId}/ref/${encodedBranchOrCommit}/sessions`
  },
  'projects/[projectId]/ref/[branchOrCommit]/schema/[...schemaFilePath]': ({
    projectId,
    branchOrCommit,
    schemaFilePath,
  }) => {
    const encodedBranchOrCommit = encodeURIComponent(branchOrCommit)
    return `/projects/${projectId}/ref/${encodedBranchOrCommit}/schema/${schemaFilePath}`
  },
  'projects/[projectId]/ref/[branchOrCommit]/schema': ({
    projectId,
    branchOrCommit,
  }) => {
    const encodedBranchOrCommit = encodeURIComponent(branchOrCommit)
    return `/projects/${projectId}/ref/${encodedBranchOrCommit}/schema`
  },
  'design_sessions/[id]': ({ id }) => {
    return `/design_sessions/${id}`
  },
  'public/design_sessions/[id]': ({ id }) => {
    return `${ROUTE_PREFIXES.PUBLIC}/design_sessions/${id}`
  },
} as const
