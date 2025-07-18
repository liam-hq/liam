import { join, resolve } from 'node:path'

/**
 * Get the workspace base path
 * Uses INIT_CWD environment variable or current working directory
 */
const getWorkspaceBasePath = (): string => {
  return process.env['INIT_CWD'] || process.cwd()
}

/**
 * Get the benchmark workspace path
 */
export const getWorkspacePath = (): string => {
  return resolve(getWorkspaceBasePath(), 'benchmark-workspace')
}

/**
 * Get a path relative to the workspace
 */
export const getWorkspaceSubPath = (...paths: string[]): string => {
  return join(getWorkspacePath(), ...paths)
}
