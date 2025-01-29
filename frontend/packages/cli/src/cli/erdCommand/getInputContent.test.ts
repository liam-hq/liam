import fs from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getInputContent } from './getInputContent.js'

vi.mock('node:fs')
vi.mock('node:https')

describe('getInputContent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should read local file content when given a valid file path', async () => {
    const mockFilePath = '/path/to/local/file.txt'
    const mockFileContent = 'Local file content'

    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent)

    const content = await getInputContent(mockFilePath)

    expect(content).toBe(mockFileContent)
  })

  it('should throw an error if the local file path is invalid', async () => {
    const mockFilePath = '/invalid/path/to/file.txt'

    vi.spyOn(fs, 'existsSync').mockReturnValue(false)

    await expect(getInputContent(mockFilePath)).rejects.toThrow(
      'Invalid input path. Please provide a valid file.',
    )
  })

  it('should download raw content from GitHub when given a GitHub blob URL', async () => {
    const mockGitHubUrl = 'https://github.com/user/repo/blob/main/file.txt'
    const mockRawUrl =
      'https://raw.githubusercontent.com/user/repo/main/file.txt'
    const mockGitHubContent = 'GitHub raw file content'

    const mockFetch = vi
      .spyOn(global, 'fetch')
      .mockImplementation(
        async () => new Response(mockGitHubContent, { status: 200 }),
      )

    const content = await getInputContent(mockGitHubUrl)

    expect(content).toBe(mockGitHubContent)
    expect(mockFetch).toHaveBeenCalledWith(mockRawUrl)
  })

  it('should download content from a regular URL', async () => {
    const mockUrl = 'https://example.com/file.txt'
    const mockUrlContent = 'Regular URL file content'

    const mockFetch = vi
      .spyOn(global, 'fetch')
      .mockImplementation(
        async () => new Response(mockUrlContent, { status: 200 }),
      )

    const content = await getInputContent(mockUrl)

    expect(content).toBe(mockUrlContent)
    expect(mockFetch).toHaveBeenCalledWith(mockUrl)
  })

  it('should throw an error when file download fails', async () => {
    const mockUrl = 'https://example.com/file.txt'

    vi.spyOn(global, 'fetch').mockImplementation(
      async () => new Response('', { status: 404, statusText: 'Not Found' }),
    )

    await expect(getInputContent(mockUrl)).rejects.toThrow(
      'Failed to download file: Not Found',
    )
  })
})
