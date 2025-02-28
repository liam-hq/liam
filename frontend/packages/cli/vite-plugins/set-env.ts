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
  // To enable remote to be acquired because it cannot be acquired in the vercel auto-deployment environment
  const remoteAddOrigin = () => {
    try {
      const remotes = execSync('git remote show').toString().trim().split('\n')
      if (!remotes.includes('origin')) {
        execSync('git remote add origin https://github.com/liam-hq/liam.git')
      }
    } catch (error) {
      console.error('Failed to add remote origin:', error)
    }
  }

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
      // Setup and fetch tags
      remoteAddOrigin()
      execSync('git fetch --tags')

      // First check if the tag exists before trying to resolve it
      const tagOutput = execSync(`git ls-remote --tags origin ${latestTagName}`)
        .toString()
        .trim()
      if (tagOutput === '') {
        return 0 // Tag doesn't exist
      }

      // If tag exists, check if current hash matches the tag
      const tagCommit = execSync(`git rev-parse ${latestTagName}`)
        .toString()
        .trim()
      return gitHash === tagCommit ? 1 : 0
    } catch (error) {
      console.error('Failed during git operations:', error)
      return 0
    }
  }

  return {
    name: 'set-env',
    config(_, { mode }) {
      remoteAddOrigin()
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

export default setEnvPlugin
