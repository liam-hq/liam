import type { Operation } from 'fast-json-patch'
import { describe, expect, it } from 'vitest'
import { applyPatchOperations } from '../applyPatchOperations'

describe('applyPatchOperations', () => {
  describe('add operation', () => {
    it('should add a value to a simple path', () => {
      const target = {}
      const operations: Operation[] = [
        { op: 'add', path: '/name', value: 'John' },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({ name: 'John' })
    })

    it('should add a value to a nested path that does not exist yet', () => {
      const target = {}
      const operations: Operation[] = [
        { op: 'add', path: '/user/profile/name', value: 'John' },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({
        user: {
          profile: {
            name: 'John',
          },
        },
      })
    })

    it('should replace a value at an existing path', () => {
      const target = { name: 'Jane' }
      const operations: Operation[] = [
        { op: 'add', path: '/name', value: 'John' },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({ name: 'John' })
    })

    it('should handle multiple add operations', () => {
      const target = {}
      const operations: Operation[] = [
        { op: 'add', path: '/name', value: 'John' },
        { op: 'add', path: '/age', value: 30 },
        { op: 'add', path: '/address/city', value: 'New York' },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({
        name: 'John',
        age: 30,
        address: {
          city: 'New York',
        },
      })
    })
  })

  describe('replace operation', () => {
    it('should replace an existing value', () => {
      const target = { name: 'Jane' }
      const operations: Operation[] = [
        { op: 'replace', path: '/name', value: 'John' },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({ name: 'John' })
    })

    it('should add a value at a path that does not exist yet', () => {
      const target = {}
      const operations: Operation[] = [
        { op: 'replace', path: '/user/profile/name', value: 'John' },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({
        user: {
          profile: {
            name: 'John',
          },
        },
      })
    })
  })

  describe('remove operation', () => {
    it('should remove an existing value', () => {
      const target = { name: 'John', age: 30 }
      const operations: Operation[] = [{ op: 'remove', path: '/name' }]

      applyPatchOperations(target, operations)

      expect(target).toEqual({ age: 30 })
    })

    it('should not throw when removing a value that does not exist', () => {
      const target = { name: 'John' }
      const operations: Operation[] = [{ op: 'remove', path: '/age' }]

      expect(() => {
        applyPatchOperations(target, operations)
      }).not.toThrow()

      expect(target).toEqual({ name: 'John' })
    })

    it('should not throw when removing a value at a path that does not exist', () => {
      const target = { user: { name: 'John' } }
      const operations: Operation[] = [
        { op: 'remove', path: '/user/profile/age' },
      ]

      expect(() => {
        applyPatchOperations(target, operations)
      }).not.toThrow()

      expect(target).toEqual({ user: { name: 'John' } })
    })

    it('should handle nested remove operations', () => {
      const target = {
        user: {
          profile: {
            name: 'John',
            age: 30,
          },
        },
      }
      const operations: Operation[] = [
        { op: 'remove', path: '/user/profile/age' },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({
        user: {
          profile: {
            name: 'John',
          },
        },
      })
    })
  })

  describe('complex scenarios', () => {
    it('should handle special characters in paths', () => {
      const target = {}
      const operations: Operation[] = [
        { op: 'add', path: '/special~1path', value: 'value with ~' },
        { op: 'add', path: '/with spaces', value: 'value with spaces' },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({
        'special~1path': 'value with ~',
        'with spaces': 'value with spaces',
      })
    })

    it('should handle null values', () => {
      const target = { name: 'John', age: 30 }
      const operations: Operation[] = [
        { op: 'add', path: '/profile', value: null },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({
        name: 'John',
        age: 30,
        profile: null,
      })
    })

    it('should handle empty objects', () => {
      const target = {}
      const operations: Operation[] = [{ op: 'add', path: '/empty', value: {} }]

      applyPatchOperations(target, operations)

      expect(target).toEqual({
        empty: {},
      })
    })

    it('should handle a mix of operations', () => {
      const target = {
        user: {
          name: 'Jane',
          profile: {
            age: 25,
          },
        },
      }

      const operations: Operation[] = [
        { op: 'add', path: '/user/profile/location', value: 'New York' },
        { op: 'replace', path: '/user/name', value: 'Jane Doe' },
        { op: 'remove', path: '/user/profile/age' },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({
        user: {
          name: 'Jane Doe',
          profile: {
            location: 'New York',
          },
        },
      })
    })

    it('should handle numeric keys in objects', () => {
      const target = {
        users: {
          '0': { id: 1, name: 'John' },
          '1': { id: 2, name: 'Jane' },
        },
      }

      // Note: The function treats array indices as object keys
      // It doesn't have special handling for arrays
      const operations: Operation[] = [
        { op: 'add', path: '/users/0/age', value: 30 },
        { op: 'replace', path: '/users/1/name', value: 'Jane Doe' },
      ]

      applyPatchOperations(target, operations)

      expect(target).toEqual({
        users: {
          '0': { id: 1, name: 'John', age: 30 },
          '1': { id: 2, name: 'Jane Doe' },
        },
      })
    })
  })
})
