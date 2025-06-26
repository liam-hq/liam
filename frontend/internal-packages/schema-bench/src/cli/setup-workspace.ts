import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { WorkspaceConfig } from '../workspace/types'
import { setupWorkspace } from '../workspace/setup/setup.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runSetupWorkspace = async (): Promise<void> => {
  const initCwd = process.env.INIT_CWD || process.cwd()
  const workspacePath = path.resolve(initCwd, 'benchmark-workspace')
  const defaultDataPath = path.resolve(
    __dirname,
    '../../../benchmark-workspace-default',
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
