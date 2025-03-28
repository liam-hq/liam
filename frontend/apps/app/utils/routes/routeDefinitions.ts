export type RouteDefinitions = {
  login: string
  projects: string
  'projects/new': string
  'projects/[projectId]': (params: { projectId: string }) => string
  'projects/[projectId]/migrations': (params: { projectId: string }) => string
  'projects/[projectId]/docs': (params: { projectId: string }) => string
  'projects/[projectId]/erd/[branchOrCommit]/[...slug]': (params: {
    projectId: string
    branchOrCommit: string
    slug: string
  }) => string
  'projects/[projectId]/knowledge-suggestions': (params: {
    projectId: string
  }) => string
  'projects/[projectId]/knowledge-suggestions/[id]': (params: {
    projectId: string
    id: string
  }) => string
  'migrations/[migrationId]': (params: { migrationId: string }) => string
  'projects/[projectId]/ref/[branchOrCommit]/docs/[docFilePath]': (params: {
    projectId: string
    branchOrCommit: string
    docFilePath: string
  }) => string
}

export const routeDefinitions: RouteDefinitions = {
  login: '/app/login',
  projects: '/app/projects',
  'projects/new': '/app/projects/new',
  'projects/[projectId]': ({ projectId }) => {
    return `/app/projects/${projectId}`
  },
  'projects/[projectId]/migrations': ({ projectId }) => {
    return `/app/projects/${projectId}/migrations`
  },
  'projects/[projectId]/docs': ({ projectId }) => {
    return `/app/projects/${projectId}/docs`
  },
  'projects/[projectId]/erd/[branchOrCommit]/[...slug]': ({
    projectId,
    branchOrCommit,
    slug,
  }) => {
    const encodedBranchOrCommit = encodeURIComponent(branchOrCommit)
    return `/app/projects/${projectId}/erd/${encodedBranchOrCommit}/${slug}`
  },
  'projects/[projectId]/knowledge-suggestions': ({ projectId }) => {
    return `/app/projects/${projectId}/knowledge-suggestions`
  },
  'projects/[projectId]/knowledge-suggestions/[id]': ({ projectId, id }) => {
    return `/app/projects/${projectId}/knowledge-suggestions/${id}`
  },
  'migrations/[migrationId]': ({ migrationId }) => {
    return `/app/migrations/${migrationId}`
  },
  'projects/[projectId]/ref/[branchOrCommit]/docs/[docFilePath]': ({
    projectId,
    branchOrCommit,
    docFilePath,
  }) => {
    const encodedBranchOrCommit = encodeURIComponent(branchOrCommit)
    return `/app/projects/${projectId}/ref/${encodedBranchOrCommit}/docs/${docFilePath}`
  },
} as const
