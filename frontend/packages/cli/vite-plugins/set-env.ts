import { execSync } from 'node:child_process'
import { type Plugin, loadEnv } from 'vite'

/**
 * This Vite plugin initializes and sets the following environment variables for the client-side environment:
 * - VITE_CLI_VERSION_VERSION: The current version of the package from package.json.
 * - VITE_CLI_VERSION_IS_RELEASED_GIT_HASH: A flag indicating whether the current GIT hash corresponds to a released tag.
 * - VITE_CLI_VERSION_GIT_HASH: The current GIT commit hash.
 * - VITE_CLI_VERSION_DATE: The commit date of the latest commit.
 * - VITE_CLI_VERSION_ENV_NAME: Environment name (preview or production).
 *
 * These variables are essential for maintaining version consistency and tracking within the deployment environment.
 */
export function setEnvPlugin(): Plugin {
  const fetchGitHash = () => {
    try {
      return execSync('git rev-parse HEAD').toString().trim()
    } catch (error) {
      console.error('Failed to get git hash:', error)
      return ''
    }
  }

  const fetchGitBranch = () => {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    } catch (error) {
      console.error('Failed to get git branch:', error)
      return ''
    }
  }

  const date = () => {
    try {
      const gitDate = execSync('git log -1 --format=%ci').toString().trim()
      return gitDate.split(' ')[0]
    } catch (error) {
      console.error('Failed to get git date:', error)
      return new Date().toISOString().split('T')[0] // fallback to current date
    }
  }

  const versionPrefix = '@liam-hq/cli@'

  const isReleasedGitHash = (gitHash: string, packageJsonVersion: string) => {
    const latestTagName = `${versionPrefix}${packageJsonVersion}`
    try {
      execSync('git fetch --tags')
      const tagCommit = execSync(`git rev-parse ${latestTagName}`)
        .toString()
        .trim()
      if (gitHash === tagCommit) {
        return 1
      }
      return 0
    } catch (error) {
      console.error('Failed to get git tag:', error)
      return 0
    }
  }

  return {
    name: 'set-env',
    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), '')

      const packageJsonVersion = env.npm_package_version
      const gitHash = fetchGitHash()
      const gitBranch = fetchGitBranch()

      // The main branch is considered production, all other branches are treated as previews.
      // This alignment is done to match the deployment settings to Vercel specified in .github/workflows.
      const envName = gitBranch === 'main' ? 'production' : 'preview'

      process.env.VITE_CLI_VERSION_VERSION = packageJsonVersion
      process.env.VITE_CLI_VERSION_IS_RELEASED_GIT_HASH = JSON.stringify(
        isReleasedGitHash(gitHash, packageJsonVersion),
      )
      process.env.VITE_CLI_VERSION_GIT_HASH = gitHash
      process.env.VITE_CLI_VERSION_ENV_NAME = envName
      process.env.VITE_CLI_VERSION_DATE = date()
    },
  }
}

