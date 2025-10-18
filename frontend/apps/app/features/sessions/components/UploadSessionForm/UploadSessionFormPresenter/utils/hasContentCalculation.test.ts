import { describe, expect, test } from 'vitest'
import { calculateHasContent } from './hasContentCalculation'

// Test helper to create a mock file
const createMockFile = (name = 'test.sql'): File => {
  return new File(['content'], name, { type: 'text/plain' })
}

describe('calculateHasContent', () => {
  describe('when form should be submittable', () => {
    test('valid file + text content', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'valid',
        textContent: 'Add membership feature',
      })

      expect(result).toBe(true)
    })

    test('text message only (no file)', () => {
      const result = calculateHasContent({
        selectedFile: null,
        schemaStatus: 'idle',
        textContent: 'Add membership feature',
      })

      expect(result).toBe(true)
    })
  })

  describe('when form should NOT be submittable', () => {
    test('valid file only (no text)', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'valid',
        textContent: '',
      })

      expect(result).toBe(false)
    })

    test('invalid file + text content', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('invalid.txt'),
        schemaStatus: 'invalid',
        textContent: 'Add membership feature',
      })

      expect(result).toBe(false)
    })

    test('valid file + only whitespace text', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'valid',
        textContent: '   \n\t  ',
      })

      expect(result).toBe(false)
    })

    test('file with idle status + text content', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'idle',
        textContent: 'Add membership feature',
      })

      expect(result).toBe(false)
    })

    test('completely empty form', () => {
      const result = calculateHasContent({
        selectedFile: null,
        schemaStatus: 'idle',
        textContent: '',
      })

      expect(result).toBe(false)
    })
  })
})
