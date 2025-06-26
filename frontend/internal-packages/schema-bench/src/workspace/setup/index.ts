import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { WorkspaceConfig } from '../types'
import { setupWorkspace } from './setup.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const main = async (): Promise<void> => {
  const initCwd = process.env.INIT_CWD || process.cwd()
  const workspacePath = path.resolve(initCwd, 'benchmark-workspace')
  const defaultDataPath = path.resolve(
    __dirname,
    '../../../benchmark-workspace-default',
  )
  const overwrite = process.argv.includes('--overwrite')

  const config: WorkspaceConfig = {
    workspacePath,
    defaultDataPath,
    overwrite,
  }

  try {
    await setupWorkspace(config)
  } catch (error) {
    console.error('❌ Workspace setup failed:', error)
    process.exit(1)
  }
}

main()