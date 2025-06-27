import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setupWorkspace } from '../workspace/setup/setup.ts'
import type { WorkspaceConfig } from '../workspace/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Right now, the script processes process.argv directly and lives in this package since it’s still rough and only meant for internal (Liam team) use.
// In the future, once things are more stable, we’d like to move this feature to the CLI package and rely on something like commander for argument parsing.
const runSetupWorkspace = async (): Promise<void> => {
  const initCwd = process.env.INIT_CWD || process.cwd()
  const workspacePath = path.resolve(initCwd, 'benchmark-workspace')
  const defaultDataPath = path.resolve(
    __dirname,
    '../../benchmark-workspace-default',
  )
  const config: WorkspaceConfig = {
    workspacePath,
    defaultDataPath,
  }

  try {
    await setupWorkspace(config)
  } catch (error) {
    console.error('❌ Workspace setup failed:', error)
    process.exit(1)
  }
}

runSetupWorkspace()
