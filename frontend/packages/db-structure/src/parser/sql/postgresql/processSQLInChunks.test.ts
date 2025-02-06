import { describe, expect, it, vi } from 'vitest'
import { processSQLInChunks } from './processSQLInChunks.js'

describe(processSQLInChunks, () => {
  describe('processSQLInChunks', () => {
    it('should split input by newline and process each chunk', async () => {
      const input = 'SELECT 1;\nSELECT 2;\nSELECT 3;'
      const chunkSize = 2
      const callback = vi.fn()

      await processSQLInChunks(input, chunkSize, callback)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('SELECT 1;\nSELECT 2;')
      expect(callback).toHaveBeenCalledWith('SELECT 3;')
    })

    it('should handle chunks correctly to avoid invalid SQL syntax', async () => {
      const input = 'SELECT 1;\nSELECT 2;\nSELECT 3;\nSELECT 4;'
      const chunkSize = 3
      const callback = vi.fn()

      await processSQLInChunks(input, chunkSize, callback)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('SELECT 1;\nSELECT 2;\nSELECT 3;')
      expect(callback).toHaveBeenCalledWith('SELECT 4;')
    })

    it('should handle input with no newlines correctly', async () => {
      const input = 'SELECT 1; SELECT 2; SELECT 3;'
      const chunkSize = 1
      const callback = vi.fn()

      await processSQLInChunks(input, chunkSize, callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('SELECT 1; SELECT 2; SELECT 3;')
    })

    it('should handle empty input correctly', async () => {
      const input = ''
      const chunkSize = 1
      const callback = vi.fn()

      await processSQLInChunks(input, chunkSize, callback)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should correctly process SQL chunks while ignoring semicolons in comment lines starting with "--"', async () => {
      const input =
        'SELECT 1;\nSELECT 2;\n-- This is a comment line; additional text here should be ignored.\nSELECT 3;\nSELECT 4;'
      const chunkSize = 3
      const callback = vi.fn()

      await processSQLInChunks(input, chunkSize, callback)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('SELECT 1;\nSELECT 2;\nSELECT 3;')
      expect(callback).toHaveBeenCalledWith('SELECT 4;')
    })

    it('should correctly process SQL chunks while ignoring multi-line comments', async () => {
      const input =
        'SELECT 1;\n/* This is a\nmulti-line comment */\nSELECT 2;\nSELECT 3;'
      const chunkSize = 3
      const callback = vi.fn()

      await processSQLInChunks(input, chunkSize, callback)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('SELECT 1;\n\nSELECT 2;')
      expect(callback).toHaveBeenCalledWith('SELECT 3;')
    })
  })
})
