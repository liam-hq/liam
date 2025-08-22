import fs from 'node:fs'
import { URL } from 'node:url'
import { glob } from 'glob'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isGitHubFileUrl(url: string): boolean {
  const parsedUrl = new URL(url)
  return parsedUrl.hostname === 'github.com' && url.includes('/blob/')
}

function normalizePathForGlob(inputPath: string): string {
  // Only convert backslashes on Windows to preserve Linux/macOS filenames with backslashes
  if (process.platform === 'win32') {
    return inputPath.replace(/\\/g, '/')
  }
  return inputPath

  // TODO: Consider using path.sep for a more elegant solution:
  // return inputPath.split(path.sep).join(path.posix.sep)
  // This approach is currently not adopted because our test suite doesn't run on Windows,
  // making it difficult to mock path.sep behavior accurately in tests.
  // Once we add Windows CI environment, we should revisit this implementation.
}

async function readLocalFiles(pattern: string): Promise<Result<string, Error>> {
  const normalizedPattern = normalizePathForGlob(pattern)
  const files = await glob(normalizedPattern)
  if (files.length === 0) {
    return err(
      new Error(
        'No files found matching the pattern. Please provide valid file(s).',
      ),
    )
  }

  // Pre-validate file existence to avoid throwing inside async map
  const missing = files.find((filePath) => !fs.existsSync(filePath))
  if (missing) {
    return err(new Error(`File not found: ${missing}`))
  }

  const contents = files.map((filePath) => fs.readFileSync(filePath, 'utf8'))
  return ok(contents.join('\n'))
}

function downloadGitHubRawContent(
  githubUrl: string,
): ResultAsync<string, Error> {
  const rawFileUrl = githubUrl
    .replace('github.com', 'raw.githubusercontent.com')
    .replace('/blob', '')
  return downloadFile(rawFileUrl)
}

function downloadFile(url: string): ResultAsync<string, Error> {
  return ResultAsync.fromPromise(
    fetch(url).then(async (response) => {
      if (!response.ok) {
        return await Promise.reject(
          new Error(`Failed to download file: ${response.statusText}`),
        )
      }
      return await response.text()
    }),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )
}

export async function getInputContent(
  inputPath: string,
): Promise<Result<string, Error>> {
  if (!isValidUrl(inputPath)) {
    return await readLocalFiles(inputPath)
  }

  const resultAsync = isGitHubFileUrl(inputPath)
    ? downloadGitHubRawContent(inputPath)
    : downloadFile(inputPath)

  return await resultAsync
}
