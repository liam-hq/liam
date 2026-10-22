import {
  fromAsyncThrowable,
  fromPromise,
  fromThrowable,
} from '@liam-hq/neverthrow'
import { Octokit } from '@octokit/rest'
import { err, type Result, type ResultAsync } from 'neverthrow'

export type GitHubRepoInfo = {
  owner: string
  repo: string
  branch: string
  path: string
}

export type GitHubContentItem = {
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  name: string
  path: string
  download_url?: string | null
}

const getFolderContentsAsync = async (
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<GitHubContentItem[]> => {
  // For public repositories, we can use unauthenticated requests
  const octokit = new Octokit()

  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref,
  })

  return Array.isArray(data) ? data : [data]
}

export const getFolderContents = (
  owner: string,
  repo: string,
  path: string,
  ref: string,
): ResultAsync<GitHubContentItem[], Error> =>
  fromAsyncThrowable(getFolderContentsAsync)(owner, repo, path, ref)

export const downloadFileContent = async (
  url: string,
  timeoutMs: number,
  maxBytes: number,
): Promise<Result<string, Error>> => {
  const parseResult = fromThrowable(() => new URL(url))()
  if (parseResult.isErr()) {
    console.error('Invalid URL:', url)
    return err(parseResult.error)
  }

  const parsed = parseResult.value
  if (parsed.hostname !== 'raw.githubusercontent.com') {
    console.error(`Disallowed host for download: ${parsed.hostname}`)
    return err(new Error(`Disallowed host: ${parsed.hostname}`))
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const fetchResult = await fromPromise(
    fetch(url, { signal: controller.signal }),
    (error) => {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`Request timeout downloading file from ${url}`)
        return new Error('Request timeout')
      }
      console.error(`Error downloading file from ${url}:`, error)
      return error instanceof Error ? error : new Error('Unknown error')
    },
  )

  if (fetchResult.isErr()) {
    return err(fetchResult.error)
  }

  clearTimeout(timeoutId)
  const response = fetchResult.value

  if (!response.ok) {
    console.error(`Failed to download file: ${response.statusText}`)
    return err(new Error(`Failed to download file: ${response.statusText}`))
  }

  const len = response.headers.get('content-length')
  if (len && Number(len) > maxBytes) {
    console.error(
      `File too large (${len} bytes). Limit: ${maxBytes} bytes for ${url}`,
    )
    return err(new Error(`File too large: ${len} bytes`))
  }

  return await fromPromise(response.text())
}
