import { describe, expect, test } from 'vitest'
import type { FileAttachment } from '../../../shared/hooks/useFileAttachments'
import { calculateHasContent } from './hasContentCalculation'

// Test helper to create a mock file
const createMockFile = (name = 'test.sql'): File => {
  return new File(['content'], name, { type: 'text/plain' })
}

// Test helper to create a mock file attachment
const createMockAttachment = (name = 'doc.pdf'): FileAttachment => {
  return {
    id: 'test-id',
    url: 'blob://test',
    name,
  }
}

describe('calculateHasContent', () => {
  describe('when form should be submittable', () => {
    test('valid file + text content', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'valid',
        textContent: 'Add membership feature',
        attachments: [],
      })

      expect(result).toBe(true)
    })

    test('valid file + attachments (no text)', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'valid',
        textContent: '',
        attachments: [createMockAttachment('doc.pdf')],
      })

      expect(result).toBe(true)
    })

    test('valid file + text content + attachments', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'valid',
        textContent: 'Add membership feature',
        attachments: [createMockAttachment('doc.pdf')],
      })

      expect(result).toBe(true)
    })

    test('valid file + whitespace-only text is treated as no text', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'valid',
        textContent: '   \n\t  ',
        attachments: [createMockAttachment('doc.pdf')],
      })

      expect(result).toBe(true)
    })

    test('text message only (no file)', () => {
      const result = calculateHasContent({
        selectedFile: null,
        schemaStatus: 'idle',
        textContent: 'Add membership feature',
        attachments: [],
      })

      expect(result).toBe(true)
    })
  })

  describe('when form should NOT be submittable', () => {
    test('valid file only (no text or attachments)', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'valid',
        textContent: '',
        attachments: [],
      })

      expect(result).toBe(false)
    })

    test('invalid file + text content', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('invalid.txt'),
        schemaStatus: 'invalid',
        textContent: 'Add membership feature',
        attachments: [],
      })

      expect(result).toBe(false)
    })

    test('valid file + only whitespace text (no attachments)', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'valid',
        textContent: '   \n\t  ',
        attachments: [],
      })

      expect(result).toBe(false)
    })

    test('file with idle status + text content', () => {
      const result = calculateHasContent({
        selectedFile: createMockFile('schema.sql'),
        schemaStatus: 'idle',
        textContent: 'Add membership feature',
        attachments: [],
      })

      expect(result).toBe(false)
    })

    test('completely empty form', () => {
      const result = calculateHasContent({
        selectedFile: null,
        schemaStatus: 'idle',
        textContent: '',
        attachments: [],
      })

      expect(result).toBe(false)
    })
  })
})
