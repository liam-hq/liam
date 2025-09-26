import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchSchemaFromGitHubFolder,
  isGitHubFolderUrl,
  parseGitHubFolderUrl,
} from './githubUrlHandler'

// Mock fetch globally
global.fetch = vi.fn()

describe('githubUrlHandler', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('isGitHubFolderUrl', () => {
    it('should return true for GitHub folder URLs', () => {
      const validUrls = [
        'https://github.com/user/repo/tree/main/schemas',
        'https://github.com/user/repo/tree/develop/db',
        'https://github.com/user/repo/tree/feature/migrations',
      ]

      for (const url of validUrls) {
        expect(isGitHubFolderUrl(url)).toBe(true)
      }
    })

    it('should return false for non-GitHub folder URLs', () => {
      const invalidUrls = [
        'https://github.com/user/repo/blob/main/schema.sql',
        'https://example.com/folder',
        'not-a-url',
        'https://github.com/user/repo',
      ]

      for (const url of invalidUrls) {
        expect(isGitHubFolderUrl(url)).toBe(false)
      }
    })

    it('should distinguish between file and folder URLs', () => {
      // File URLs (blob) should be false
      const fileUrls = [
        'https://github.com/user/repo/blob/main/schema.sql',
        'https://github.com/user/repo/blob/dev/db/schema.prisma',
      ]

      // Folder URLs (tree) should be true
      const folderUrls = [
        'https://github.com/user/repo/tree/main/schemas',
        'https://github.com/user/repo/tree/dev/db',
      ]

      for (const url of fileUrls) {
        expect(isGitHubFolderUrl(url)).toBe(false)
      }
      for (const url of folderUrls) {
        expect(isGitHubFolderUrl(url)).toBe(true)
      }
    })
  })

  describe('parseGitHubFolderUrl', () => {
    it('should parse valid GitHub folder URLs', () => {
      const url = 'https://github.com/user/repo/tree/main/schemas/db'
      const result = parseGitHubFolderUrl(url)

      expect(result).toEqual({
        owner: 'user',
        repo: 'repo',
        branch: 'main',
        path: 'schemas/db',
      })
    })

    it('should return null for invalid URLs', () => {
      const invalidUrls = [
        'https://github.com/user/repo/blob/main/file.sql',
        'https://github.com/user/repo/tree/', // Missing branch
        'invalid-url',
      ]

      for (const url of invalidUrls) {
        expect(parseGitHubFolderUrl(url)).toBeNull()
      }
    })
  })

  describe('fetchSchemaFromGitHubFolder', () => {
    it('should fetch and combine schema files from GitHub folder', async () => {
      const mockFetch = vi.mocked(fetch)
      const url = 'https://github.com/user/repo/tree/main/schemas'

      // Mock GitHub API response
      const mockApiResponse = [
        {
          type: 'file',
          name: 'users.sql',
          path: 'schemas/users.sql',
          download_url:
            'https://raw.githubusercontent.com/user/repo/main/schemas/users.sql',
        },
        {
          type: 'file',
          name: 'posts.sql',
          path: 'schemas/posts.sql',
          download_url:
            'https://raw.githubusercontent.com/user/repo/main/schemas/posts.sql',
        },
        {
          type: 'file',
          name: 'README.md',
          path: 'schemas/README.md',
          download_url:
            'https://raw.githubusercontent.com/user/repo/main/schemas/README.md',
        },
      ]

      const mockUsersSql = 'CREATE TABLE users (id INT PRIMARY KEY);'
      const mockPostsSql = 'CREATE TABLE posts (id INT PRIMARY KEY);'

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockApiResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(new Response(mockUsersSql, { status: 200 }))
        .mockResolvedValueOnce(new Response(mockPostsSql, { status: 200 }))

      const result = await fetchSchemaFromGitHubFolder(url)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.content).toBe(
          `\n// --- File 1 ---\n${mockUsersSql}\n\n\n// --- File 2 ---\n${mockPostsSql}`,
        )
        expect(result.value.detectedFormat).toBe('postgres')
      }

      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should return error for invalid URL', async () => {
      const result = await fetchSchemaFromGitHubFolder('invalid-url')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Invalid GitHub folder URL format')
      }
    })

    it('should handle GitHub API errors', async () => {
      const mockFetch = vi.mocked(fetch)
      const url = 'https://github.com/user/repo/tree/main/nonexistent'

      mockFetch.mockResolvedValueOnce(
        new Response('Not Found', { status: 404, statusText: 'Not Found' }),
      )

      const result = await fetchSchemaFromGitHubFolder(url)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain(
          'Failed to fetch GitHub folder contents',
        )
      }
    })

    it('should return error when no schema files found', async () => {
      const mockFetch = vi.mocked(fetch)
      const url = 'https://github.com/user/repo/tree/main/docs'

      const mockApiResponse = [
        {
          type: 'file',
          name: 'README.md',
          path: 'docs/README.md',
          download_url:
            'https://raw.githubusercontent.com/user/repo/main/docs/README.md',
        },
      ]

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockApiResponse), { status: 200 }),
      )

      const result = await fetchSchemaFromGitHubFolder(url)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe(
          'No schema files found in the specified folder',
        )
      }
    })

    it('should skip excluded files like index.ts', async () => {
      const mockFetch = vi.mocked(fetch)
      const url = 'https://github.com/user/repo/tree/main/schemas'

      const mockApiResponse = [
        {
          type: 'file',
          name: 'index.ts',
          path: 'schemas/index.ts',
          download_url:
            'https://raw.githubusercontent.com/user/repo/main/schemas/index.ts',
        },
        {
          type: 'file',
          name: 'schema.sql',
          path: 'schemas/schema.sql',
          download_url:
            'https://raw.githubusercontent.com/user/repo/main/schemas/schema.sql',
        },
      ]

      const mockSchemaSql = 'CREATE TABLE test (id INT);'

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockApiResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(new Response(mockSchemaSql, { status: 200 }))

      const result = await fetchSchemaFromGitHubFolder(url)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.content).not.toContain('export')
        expect(result.value.content).toContain('CREATE TABLE test')
      }
      expect(mockFetch).toHaveBeenCalledTimes(2) // API call + 1 file (index.ts excluded)
    })

    it('should skip various excluded file types', async () => {
      const mockFetch = vi.mocked(fetch)
      const url = 'https://github.com/user/repo/tree/main/db'

      const mockApiResponse = [
        // Should be excluded
        {
          type: 'file',
          name: 'seed.sql',
          download_url: 'https://example.com/seed.sql',
        },
        {
          type: 'file',
          name: 'client.prisma',
          download_url: 'https://example.com/client.prisma',
        },
        {
          type: 'file',
          name: 'seeds.rb',
          download_url: 'https://example.com/seeds.rb',
        },
        {
          type: 'file',
          name: 'migrate.ts',
          download_url: 'https://example.com/migrate.ts',
        },
        {
          type: 'file',
          name: 'readme.md',
          download_url: 'https://example.com/readme.md',
        },

        // Should be included
        {
          type: 'file',
          name: 'schema.prisma',
          download_url: 'https://example.com/schema.prisma',
        },
        {
          type: 'file',
          name: 'users.sql',
          download_url: 'https://example.com/users.sql',
        },
      ]

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockApiResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response('model User { id Int @id }', { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response('CREATE TABLE users (id INT);', { status: 200 }),
        )

      const result = await fetchSchemaFromGitHubFolder(url)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.content).toContain('model User')
        expect(result.value.content).toContain('CREATE TABLE users')
        expect(result.value.content).not.toContain('seed')
        expect(result.value.content).not.toContain('client')
        expect(result.value.content).not.toContain('migrate')
      }
      // API call + 2 valid schema files (5 files excluded)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should detect format from multiple file types', async () => {
      const mockFetch = vi.mocked(fetch)
      const url = 'https://github.com/user/repo/tree/main/schemas'

      const mockApiResponse = [
        {
          type: 'file',
          name: 'user.prisma',
          download_url: 'https://example.com/user.prisma',
        },
        {
          type: 'file',
          name: 'post.sql',
          download_url: 'https://example.com/post.sql',
        },
      ]

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockApiResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(new Response('model User {}', { status: 200 }))
        .mockResolvedValueOnce(
          new Response('CREATE TABLE posts', { status: 200 }),
        )

      const result = await fetchSchemaFromGitHubFolder(url)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.detectedFormat).toBe('prisma') // Prisma has higher priority
      }
    })

    it('should recursively process subdirectories', async () => {
      const mockFetch = vi.mocked(fetch)
      const url = 'https://github.com/user/repo/tree/main/db'

      // Mock parent folder response
      const mockParentResponse = [
        {
          type: 'file',
          name: 'schema.sql',
          download_url: 'https://example.com/schema.sql',
        },
        { type: 'dir', name: 'migrations', path: 'db/migrations' },
      ]

      // Mock subdirectory response
      const mockSubdirResponse = [
        {
          type: 'file',
          name: '001_init.sql',
          download_url: 'https://example.com/001_init.sql',
        },
      ]

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockParentResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockSubdirResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response('CREATE TABLE users', { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response('CREATE TABLE migrations', { status: 200 }),
        )

      const result = await fetchSchemaFromGitHubFolder(url)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.content).toContain('CREATE TABLE users')
        expect(result.value.content).toContain('CREATE TABLE migrations')
      }
      expect(mockFetch).toHaveBeenCalledTimes(4) // 2 API calls + 2 file downloads
    })
  })
})
