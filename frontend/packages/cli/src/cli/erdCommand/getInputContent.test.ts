import fs from 'node:fs'
import { glob } from 'glob'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getInputContent } from './getInputContent.js'

vi.mock('node:fs')
vi.mock('node:https')
vi.mock('glob')

describe('getInputContent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should read local file content when given a valid file path', async () => {
    const mockFilePath = '/path/to/local/file.txt'
    const mockFileContent = 'Local file content'

    vi.mocked(glob).mockImplementation(async (pattern) => {
      if (pattern === mockFilePath) {
        return [mockFilePath]
      }
      return []
    })
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent)

    const result = await getInputContent(mockFilePath)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe(mockFileContent)
    }
  })

  it('should throw an error if the local file path is invalid', async () => {
    const mockFilePath = '/invalid/path/to/file.txt'

    vi.mocked(glob).mockImplementation(async (pattern) => {
      if (pattern === mockFilePath) {
        return [mockFilePath]
      }
      return []
    })
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)

    const result = await getInputContent(mockFilePath)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe(
        'File not found: /invalid/path/to/file.txt',
      )
    }
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

    const result = await getInputContent(mockGitHubUrl)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe(mockGitHubContent)
    }
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

    const result = await getInputContent(mockUrl)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe(mockUrlContent)
    }
    expect(mockFetch).toHaveBeenCalledWith(mockUrl)
  })

  it('should throw an error when file download fails', async () => {
    const mockUrl = 'https://example.com/file.txt'

    vi.spyOn(global, 'fetch').mockImplementation(
      async () => new Response('', { status: 404, statusText: 'Not Found' }),
    )

    const result = await getInputContent(mockUrl)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe('Failed to download file: Not Found')
    }
  })

  it('should read and combine multiple files when given a glob pattern', async () => {
    const mockFiles = ['/path/to/file1.sql', '/path/to/file2.sql']
    const mockContents = ['Content of file 1', 'Content of file 2']

    vi.mocked(glob).mockImplementation(async (pattern) => {
      if (pattern === '/path/to/*.sql') {
        return mockFiles
      }
      return []
    })
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync')
      .mockReturnValueOnce(mockContents[0])
      .mockReturnValueOnce(mockContents[1])

    const result = await getInputContent('/path/to/*.sql')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe(mockContents.join('\n'))
    }
    expect(glob).toHaveBeenCalledWith('/path/to/*.sql')
  })

  it('should throw an error if any matched file does not exist', async () => {
    const mockFiles = ['/path/to/file1.sql', '/path/to/nonexistent.sql']
    vi.mocked(glob).mockImplementation(async (pattern) => {
      if (pattern === '*.sql') {
        return mockFiles
      }
      return []
    })
    vi.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('file1 content')

    const result = await getInputContent('*.sql')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe(
        'File not found: /path/to/nonexistent.sql',
      )
    }
  })

  it('should throw an error if no files match the glob pattern', async () => {
    vi.mocked(glob).mockImplementation(async () => [])

    const result = await getInputContent('*.nonexistent')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe(
        'No files found matching the pattern. Please provide valid file(s).',
      )
    }
  })

  describe('Windows path handling', () => {
    const originalPlatform = process.platform

    beforeEach(() => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      })
    })

    afterEach(() => {
      // Restore original platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      })
    })

    it('should convert Windows backslashes to forward slashes', async () => {
      const windowsPath = 'src\\schema\\file.prisma'
      const normalizedPath = 'src/schema/file.prisma'
      const mockFileContent = 'Schema content'

      vi.mocked(glob).mockImplementation(async (pattern) => {
        if (pattern === normalizedPath) {
          return [normalizedPath]
        }
        return []
      })
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent)

      const result = await getInputContent(windowsPath)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(mockFileContent)
      }
      expect(glob).toHaveBeenCalledWith(normalizedPath)
    })

    it('should handle Windows glob patterns with backslashes', async () => {
      const windowsGlob = 'src\\**\\*.prisma'
      const normalizedGlob = 'src/**/*.prisma'
      const mockFiles = ['src/db/schema.prisma', 'src/auth/schema.prisma']
      const mockContents = ['DB schema', 'Auth schema']

      vi.mocked(glob).mockImplementation(async (pattern) => {
        if (pattern === normalizedGlob) {
          return mockFiles
        }
        return []
      })
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readFileSync')
        .mockReturnValueOnce(mockContents[0])
        .mockReturnValueOnce(mockContents[1])

      const result = await getInputContent(windowsGlob)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(mockContents.join('\n'))
      }
      expect(glob).toHaveBeenCalledWith(normalizedGlob)
    })

    it('should handle mixed forward and backward slashes', async () => {
      const mixedPath = 'src/schema\\file.prisma'
      const normalizedPath = 'src/schema/file.prisma'
      const mockFileContent = 'Mixed path content'

      vi.mocked(glob).mockImplementation(async (pattern) => {
        if (pattern === normalizedPath) {
          return [normalizedPath]
        }
        return []
      })
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent)

      const result = await getInputContent(mixedPath)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(mockFileContent)
      }
      expect(glob).toHaveBeenCalledWith(normalizedPath)
    })
  })

  describe('Linux/macOS path handling', () => {
    const originalPlatform = process.platform

    beforeEach(() => {
      // Mock Linux platform
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      })
    })

    afterEach(() => {
      // Restore original platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      })
    })

    it('should preserve backslashes in filenames on Linux/macOS', async () => {
      const linuxPathWithBackslash = 'file\\with\\backslash.txt'
      const mockFileContent = 'Linux file with backslash in name'

      vi.mocked(glob).mockImplementation(async (pattern) => {
        // On Linux, backslash should be preserved
        if (pattern === linuxPathWithBackslash) {
          return [linuxPathWithBackslash]
        }
        return []
      })
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent)

      const result = await getInputContent(linuxPathWithBackslash)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(mockFileContent)
      }
      // Should be called with the original path, not converted
      expect(glob).toHaveBeenCalledWith(linuxPathWithBackslash)
    })

    it('should work normally with forward slashes on Linux/macOS', async () => {
      const linuxPath = 'src/schema/file.prisma'
      const mockFileContent = 'Linux file content'

      vi.mocked(glob).mockImplementation(async (pattern) => {
        if (pattern === linuxPath) {
          return [linuxPath]
        }
        return []
      })
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent)

      const result = await getInputContent(linuxPath)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(mockFileContent)
      }
      expect(glob).toHaveBeenCalledWith(linuxPath)
    })
  })
})
