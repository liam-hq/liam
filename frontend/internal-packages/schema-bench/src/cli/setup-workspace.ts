import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setupWorkspace } from '../workspace/setup/setup.ts'
import type { WorkspaceConfig, WorkspaceError } from '../workspace/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Right now, the script processes process.argv directly and lives in this package since it's still rough and only meant for internal (Liam team) use.
// In the future, once things are more stable, we'd like to move this feature to the CLI package and rely on something like commander for argument parsing.

const formatError = (error: WorkspaceError): string => {
  switch (error.type) {
    case 'DIRECTORY_NOT_FOUND':
      return `Directory not found: ${error.path}`
    case 'FILE_READ_ERROR':
      return `Failed to read file at ${error.path}: ${error.cause}`
    case 'FILE_WRITE_ERROR':
      return `Failed to write file at ${error.path}: ${error.cause}`
    case 'JSON_PARSE_ERROR':
      return `Failed to parse JSON at ${error.path}: ${error.cause}`
    case 'SCHEMA_NOT_FOUND':
      return `${error.schemaType} schema not found for case: ${error.caseId}`
    case 'VALIDATION_ERROR':
      return `Validation error: ${error.message}`
    case 'EVALUATION_ERROR':
      return `Evaluation failed for case ${error.caseId}: ${error.cause}`
    default:
      return 'Unknown error occurred'
  }
}

const runSetupWorkspace = async (): Promise<void> => {
  const initCwd = process.env['INIT_CWD'] || process.cwd()
  const workspacePath = path.resolve(initCwd, 'benchmark-workspace')
  const defaultDataPath = path.resolve(
    __dirname,
    '../../benchmark-workspace-default',
  )
  const config: WorkspaceConfig = {
    workspacePath,
    defaultDataPath,
  }

  const result = await setupWorkspace(config)

  if (result.isErr()) {
    console.error('❌ Workspace setup failed:', formatError(result.error))
    process.exit(1)
  }
}

runSetupWorkspace()
