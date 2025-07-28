import type { Operation } from 'fast-json-patch'
import { describe, expect, it } from 'vitest'
import { applyPatchOperations } from '../applyPatchOperations.js'

describe('applyPatchOperations', () => {
  describe('add operation', () => {
    it('should add a value to a simple path', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/name', value: 'John' },
      ]

      const result = applyPatchOperations({}, operations)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({ name: 'John' })
      }
    })

    it('should return an error when adding to a nested path that does not exist', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/user/profile/name', value: 'John' },
      ]

      const result = applyPatchOperations({}, operations)

      expect(result.isErr()).toBe(true)
    })

    it('should replace a value at an existing path', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/name', value: 'John' },
      ]

      const result = applyPatchOperations({ name: 'Jane' }, operations)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({ name: 'John' })
      }
    })

    it('should handle multiple add operations', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/name', value: 'John' },
        { op: 'add', path: '/age', value: 30 },
      ]

      const result = applyPatchOperations({}, operations)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({
          name: 'John',
          age: 30,
        })
      }
    })
  })

  describe('replace operation', () => {
    it('should replace an existing value', () => {
      const operations: Operation[] = [
        { op: 'replace', path: '/name', value: 'John' },
      ]

      const result = applyPatchOperations({ name: 'Jane' }, operations)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({ name: 'John' })
      }
    })

    it('should return an error when replacing at a path that does not exist', () => {
      const operations: Operation[] = [
        { op: 'replace', path: '/user/profile/name', value: 'John' },
      ]

      const result = applyPatchOperations({}, operations)

      expect(result.isErr()).toBe(true)
    })
  })

  describe('remove operation', () => {
    it('should remove an existing value', () => {
      const operations: Operation[] = [{ op: 'remove', path: '/name' }]

      const result = applyPatchOperations({ name: 'John', age: 30 }, operations)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({ age: 30 })
      }
    })

    it('should return an error when removing a value that does not exist', () => {
      const operations: Operation[] = [{ op: 'remove', path: '/age' }]

      const result = applyPatchOperations({ name: 'John' }, operations)

      expect(result.isErr()).toBe(true)
    })

    it('should return an error when removing a value at a path that does not exist', () => {
      const operations: Operation[] = [
        { op: 'remove', path: '/user/profile/age' },
      ]

      const result = applyPatchOperations(
        { user: { name: 'John' } },
        operations,
      )

      expect(result.isErr()).toBe(true)
    })

    it('should handle nested remove operations', () => {
      const operations: Operation[] = [
        { op: 'remove', path: '/user/profile/age' },
      ]

      const result = applyPatchOperations(
        {
          user: {
            profile: {
              name: 'John',
              age: 30,
            },
          },
        },
        operations,
      )

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({
          user: {
            profile: {
              name: 'John',
            },
          },
        })
      }
    })
  })

  describe('complex scenarios', () => {
    it('should handle special characters in paths', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/special~1path', value: 'value with ~' },
        { op: 'add', path: '/with spaces', value: 'value with spaces' },
      ]

      const result = applyPatchOperations({}, operations)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({
          'special/path': 'value with ~',
          'with spaces': 'value with spaces',
        })
      }
    })

    it('should handle null values', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/profile', value: null },
      ]

      const result = applyPatchOperations({ name: 'John', age: 30 }, operations)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({
          name: 'John',
          age: 30,
          profile: null,
        })
      }
    })

    it('should handle empty objects', () => {
      const operations: Operation[] = [{ op: 'add', path: '/empty', value: {} }]

      const result = applyPatchOperations({}, operations)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({
          empty: {},
        })
      }
    })

    it('should handle a mix of operations', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/user/profile/location', value: 'New York' },
        { op: 'replace', path: '/user/name', value: 'Jane Doe' },
        { op: 'remove', path: '/user/profile/age' },
      ]

      const result = applyPatchOperations(
        {
          user: {
            name: 'Jane',
            profile: {
              age: 25,
            },
          },
        },
        operations,
      )

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({
          user: {
            name: 'Jane Doe',
            profile: {
              location: 'New York',
            },
          },
        })
      }
    })

    it('should handle numeric keys in objects', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/users/0/age', value: 30 },
        { op: 'replace', path: '/users/1/name', value: 'Jane Doe' },
      ]

      const result = applyPatchOperations(
        {
          users: {
            '0': { id: 1, name: 'John' },
            '1': { id: 2, name: 'Jane' },
          },
        },
        operations,
      )

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({
          users: {
            '0': { id: 1, name: 'John', age: 30 },
            '1': { id: 2, name: 'Jane Doe' },
          },
        })
      }
    })
  })
})
