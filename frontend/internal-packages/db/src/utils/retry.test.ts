import { err, ok } from '@liam-hq/neverthrow'
import { describe, expect, it, vi } from 'vitest'
import { retry } from './retry'

describe('retry', () => {
  describe('successful operation', () => {
    it('should return success result without retry when operation succeeds', async () => {
      const mockFn = vi.fn().mockResolvedValue(ok('success'))

      const result = await retry(mockFn)

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('retry functionality with retryable errors', () => {
    it('should retry on network errors and eventually succeed', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(err(new Error('fetch failed')))
        .mockResolvedValueOnce(err(new Error('connection refused')))
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should retry on timeout errors', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(err(new Error('timeout')))
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should retry on ENOTFOUND errors', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(
          err({ name: 'ENOTFOUND', message: 'DNS lookup failed' }),
        )
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should retry on HTTP 5xx server errors', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(err(new Error('500 Internal Server Error')))
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should retry on Cloudflare server errors', async () => {
      const cloudflareError = new Error(`<html>
<head><title>500 Internal Server Error</title></head>
<body>
<center><h1>500 Internal Server Error</h1></center>
<hr><center>cloudflare</center>
</body>
</html>`)

      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(err(cloudflareError))
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should retry on various 5xx status codes', async () => {
      const testCases = [
        '502 Bad Gateway',
        '503 Service Unavailable',
        '504 Gateway Timeout',
      ]

      for (const errorMessage of testCases) {
        const mockFn = vi
          .fn()
          .mockResolvedValueOnce(err(new Error(errorMessage)))
          .mockResolvedValue(ok('success'))

        const result = await retry(mockFn, { baseDelayMs: 10 })

        expect(result.isOk()).toBe(true)
        expect(mockFn).toHaveBeenCalledTimes(2)
      }
    })
    it('should retry on gateway errors', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(err(new Error('gateway error')))
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should retry on connection lost errors', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(err(new Error('Network connection lost.')))
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('non-retryable errors', () => {
    it('should not retry on authentication errors', async () => {
      const mockFn = vi.fn().mockResolvedValue(err(new Error('Unauthorized')))

      const result = await retry(mockFn)

      expect(result.isErr()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should not retry on validation errors', async () => {
      const mockFn = vi.fn().mockResolvedValue(err(new Error('Invalid input')))

      const result = await retry(mockFn)

      expect(result.isErr()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should not retry on 4xx errors (excluding specific cases)', async () => {
      const mockFn = vi.fn().mockResolvedValue(err(new Error('Bad Request')))

      const result = await retry(mockFn)

      expect(result.isErr()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('max attempts', () => {
    it('should stop retrying after max attempts (3)', async () => {
      const mockFn = vi.fn().mockResolvedValue(err(new Error('network error')))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isErr()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should succeed within max attempts', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(err(new Error('network error')))
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should stop retrying after custom max attempts', async () => {
      const mockFn = vi.fn().mockResolvedValue(err(new Error('network error')))

      const result = await retry(mockFn, { maxAttempts: 2, baseDelayMs: 10 })

      expect(result.isErr()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('retry behavior', () => {
    it('should retry retryable errors and succeed eventually', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(err(new Error('network error')))
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should use exponential backoff with custom settings', async () => {
      const startTime = Date.now()
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(err(new Error('network error')))
        .mockResolvedValueOnce(err(new Error('network error')))
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, {
        baseDelayMs: 50,
        backoffMultiplier: 2,
      })

      const elapsedTime = Date.now() - startTime
      // Should wait 50ms + 100ms = at least 150ms total
      expect(elapsedTime).toBeGreaterThanOrEqual(140)
      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(3)
    })
  })

  describe('custom retry condition', () => {
    it('should handle errors in both message and name fields', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(
          err({ name: 'timeout', message: 'operation timed out' }),
        )
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should handle Error objects with specific names', async () => {
      const error = new Error('network timeout')
      error.name = 'TimeoutError'
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce(err(error))
        .mockResolvedValue(ok('success'))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isOk()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should not retry on null errors', async () => {
      const mockFn = vi.fn().mockResolvedValue(err(null))

      const result = await retry(mockFn, { baseDelayMs: 10 })

      expect(result.isErr()).toBe(true)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})
