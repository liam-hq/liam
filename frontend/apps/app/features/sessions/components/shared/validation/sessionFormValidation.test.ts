import * as v from 'valibot'
import { describe, expect, test } from 'vitest'
import { PasteFormDataSchema } from './sessionFormValidation'

describe('PasteFormDataSchema', () => {
  describe('when validation should succeed', () => {
    test('valid paste form data with all required fields', () => {
      const result = v.safeParse(PasteFormDataSchema, {
        schemaContent: 'CREATE TABLE users (id INT);',
        schemaFormat: 'postgres',
        initialMessage: 'Test message',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output.schemaContent).toBe('CREATE TABLE users (id INT);')
        expect(result.output.schemaFormat).toBe('postgres')
        expect(result.output.initialMessage).toBe('Test message')
      }
    })

    test('valid with different schema formats', () => {
      const formats = ['postgres', 'schemarb', 'prisma', 'tbls'] as const

      formats.forEach((format) => {
        const result = v.safeParse(PasteFormDataSchema, {
          schemaContent: 'schema content',
          schemaFormat: format,
          initialMessage: 'Test',
        })

        expect(result.success).toBe(true)
      })
    })

    test('valid with optional parentDesignSessionId', () => {
      const result = v.safeParse(PasteFormDataSchema, {
        schemaContent: 'CREATE TABLE test (id INT);',
        schemaFormat: 'postgres',
        initialMessage: 'Test',
        parentDesignSessionId: 'parent-session-123',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('when validation should fail', () => {
    test('empty schema content', () => {
      const result = v.safeParse(PasteFormDataSchema, {
        schemaContent: '',
        schemaFormat: 'postgres',
        initialMessage: 'Test',
      })

      expect(result.success).toBe(false)
    })

    test('empty initial message', () => {
      const result = v.safeParse(PasteFormDataSchema, {
        schemaContent: 'CREATE TABLE test (id INT);',
        schemaFormat: 'postgres',
        initialMessage: '',
      })

      expect(result.success).toBe(false)
    })

    test('invalid schema format', () => {
      const result = v.safeParse(PasteFormDataSchema, {
        schemaContent: 'CREATE TABLE test (id INT);',
        schemaFormat: 'invalid-format',
        initialMessage: 'Test',
      })

      expect(result.success).toBe(false)
    })

    test('missing schemaContent field', () => {
      const result = v.safeParse(PasteFormDataSchema, {
        schemaFormat: 'postgres',
        initialMessage: 'Test',
      })

      expect(result.success).toBe(false)
    })

    test('missing schemaFormat field', () => {
      const result = v.safeParse(PasteFormDataSchema, {
        schemaContent: 'CREATE TABLE test (id INT);',
        initialMessage: 'Test',
      })

      expect(result.success).toBe(false)
    })

    test('whitespace-only initial message', () => {
      const result = v.safeParse(PasteFormDataSchema, {
        schemaContent: 'CREATE TABLE test (id INT);',
        schemaFormat: 'postgres',
        initialMessage: '   \n\t  ',
      })

      // Note: Current schema doesn't trim, so this would pass
      // This test documents the current behavior
      expect(result.success).toBe(true)
    })

    test('schema content exceeds max length (100KB)', () => {
      const largeContent = 'A'.repeat(100001) // 100,001 characters
      const result = v.safeParse(PasteFormDataSchema, {
        schemaContent: largeContent,
        schemaFormat: 'postgres',
        initialMessage: 'Test',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('edge cases', () => {
    test('schema content at exact max length boundary (100KB)', () => {
      const maxContent = 'A'.repeat(100000) // Exactly 100,000 characters
      const result = v.safeParse(PasteFormDataSchema, {
        schemaContent: maxContent,
        schemaFormat: 'postgres',
        initialMessage: 'Test',
      })

      expect(result.success).toBe(true)
    })
  })
})
