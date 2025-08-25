import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import {
  type AddEnumOperation,
  addEnumOperationSchema,
  isAddEnumOperation,
  isRemoveEnumOperation,
  isReplaceEnumCommentOperation,
  isReplaceEnumNameOperation,
  isReplaceEnumValuesOperation,
  type RemoveEnumOperation,
  type ReplaceEnumCommentOperation,
  type ReplaceEnumNameOperation,
  type ReplaceEnumValuesOperation,
  removeEnumOperationSchema,
  replaceEnumCommentOperationSchema,
  replaceEnumNameOperationSchema,
  replaceEnumValuesOperationSchema,
} from '../enum.js'

describe('enumOperations', () => {
  describe('AddEnumOperation', () => {
    const validAddOperation: AddEnumOperation = {
      op: 'add',
      path: '/enums/status',
      value: {
        name: 'status',
        values: ['active', 'inactive'],
        comment: null,
      },
    }

    it('should validate a correct add enum operation', () => {
      const result = v.safeParse(addEnumOperationSchema, validAddOperation)
      expect(result.success).toBe(true)
    })

    it('should invalidate add operation with wrong op', () => {
      const invalidOperation = { ...validAddOperation, op: 'replace' }
      const result = v.safeParse(addEnumOperationSchema, invalidOperation)
      expect(result.success).toBe(false)
    })

    it('should invalidate add operation with wrong path format', () => {
      const invalidOperation = { ...validAddOperation, path: '/enums' }
      const result = v.safeParse(addEnumOperationSchema, invalidOperation)
      expect(result.success).toBe(false)
    })

    it('should validate type guard', () => {
      expect(isAddEnumOperation(validAddOperation)).toBe(true)
      expect(isAddEnumOperation({ op: 'remove', path: '/enums/status' })).toBe(
        false,
      )
    })
  })

  describe('RemoveEnumOperation', () => {
    const validRemoveOperation: RemoveEnumOperation = {
      op: 'remove',
      path: '/enums/status',
    }

    it('should validate a correct remove enum operation', () => {
      const result = v.safeParse(
        removeEnumOperationSchema,
        validRemoveOperation,
      )
      expect(result.success).toBe(true)
    })

    it('should invalidate remove operation with wrong op', () => {
      const invalidOperation = { ...validRemoveOperation, op: 'add' }
      const result = v.safeParse(removeEnumOperationSchema, invalidOperation)
      expect(result.success).toBe(false)
    })

    it('should validate type guard', () => {
      expect(isRemoveEnumOperation(validRemoveOperation)).toBe(true)
      expect(
        isRemoveEnumOperation({
          op: 'add',
          path: '/enums/status',
          value: { name: 'status', values: [], comment: null },
        }),
      ).toBe(false)
    })
  })

  describe('ReplaceEnumNameOperation', () => {
    const validReplaceNameOperation: ReplaceEnumNameOperation = {
      op: 'replace',
      path: '/enums/status/name',
      value: 'user_status',
    }

    it('should validate a correct replace enum name operation', () => {
      const result = v.safeParse(
        replaceEnumNameOperationSchema,
        validReplaceNameOperation,
      )
      expect(result.success).toBe(true)
    })

    it('should invalidate replace name operation with wrong path', () => {
      const invalidOperation = {
        ...validReplaceNameOperation,
        path: '/enums/status',
      }
      const result = v.safeParse(
        replaceEnumNameOperationSchema,
        invalidOperation,
      )
      expect(result.success).toBe(false)
    })

    it('should invalidate replace name operation with empty name', () => {
      const invalidOperation = {
        ...validReplaceNameOperation,
        value: '',
      }
      const result = v.safeParse(
        replaceEnumNameOperationSchema,
        invalidOperation,
      )
      expect(result.success).toBe(false)
    })

    it('should validate type guard', () => {
      expect(isReplaceEnumNameOperation(validReplaceNameOperation)).toBe(true)
      expect(
        isReplaceEnumNameOperation({
          op: 'replace',
          path: '/enums/status/values',
          value: ['active'],
        }),
      ).toBe(false)
    })
  })

  describe('ReplaceEnumValuesOperation', () => {
    const validReplaceValuesOperation: ReplaceEnumValuesOperation = {
      op: 'replace',
      path: '/enums/priority/values',
      value: ['low', 'medium', 'high'],
    }

    it('should validate a correct replace enum values operation', () => {
      const result = v.safeParse(
        replaceEnumValuesOperationSchema,
        validReplaceValuesOperation,
      )
      expect(result.success).toBe(true)
    })

    it('should invalidate replace values operation with non-array value', () => {
      const invalidOperation = {
        ...validReplaceValuesOperation,
        value: 'not-an-array',
      }
      const result = v.safeParse(
        replaceEnumValuesOperationSchema,
        invalidOperation,
      )
      expect(result.success).toBe(false)
    })

    it('should invalidate replace values operation with empty array', () => {
      const invalidOperation = {
        ...validReplaceValuesOperation,
        value: [],
      }
      const result = v.safeParse(
        replaceEnumValuesOperationSchema,
        invalidOperation,
      )
      expect(result.success).toBe(false)
    })

    it('should validate type guard', () => {
      expect(isReplaceEnumValuesOperation(validReplaceValuesOperation)).toBe(
        true,
      )
      expect(
        isReplaceEnumValuesOperation({
          op: 'replace',
          path: '/enums/status/name',
          value: 'status',
        }),
      ).toBe(false)
    })
  })

  describe('ReplaceEnumCommentOperation', () => {
    const validReplaceCommentOperation: ReplaceEnumCommentOperation = {
      op: 'replace',
      path: '/enums/role/comment',
      value: 'User role enumeration',
    }

    const validReplaceCommentNullOperation: ReplaceEnumCommentOperation = {
      op: 'replace',
      path: '/enums/role/comment',
      value: null,
    }

    it('should validate a correct replace enum comment operation with string', () => {
      const result = v.safeParse(
        replaceEnumCommentOperationSchema,
        validReplaceCommentOperation,
      )
      expect(result.success).toBe(true)
    })

    it('should validate a correct replace enum comment operation with null', () => {
      const result = v.safeParse(
        replaceEnumCommentOperationSchema,
        validReplaceCommentNullOperation,
      )
      expect(result.success).toBe(true)
    })

    it('should invalidate replace comment operation with number value', () => {
      const invalidOperation = {
        ...validReplaceCommentOperation,
        value: 42,
      }
      const result = v.safeParse(
        replaceEnumCommentOperationSchema,
        invalidOperation,
      )
      expect(result.success).toBe(false)
    })

    it('should validate type guard', () => {
      expect(isReplaceEnumCommentOperation(validReplaceCommentOperation)).toBe(
        true,
      )
      expect(
        isReplaceEnumCommentOperation(validReplaceCommentNullOperation),
      ).toBe(true)
      expect(
        isReplaceEnumCommentOperation({
          op: 'replace',
          path: '/enums/status/values',
          value: ['active'],
        }),
      ).toBe(false)
    })
  })

  describe('Path patterns', () => {
    it('should match valid enum base paths', () => {
      const validPaths = [
        '/enums/status',
        '/enums/user_role',
        '/enums/priority',
      ]

      for (const path of validPaths) {
        // Extract enum name from path to match path/value.name consistency requirement
        const enumName = path.replace('/enums/', '')
        const operation = {
          op: 'add' as const,
          path,
          value: { name: enumName, values: ['a'], comment: null },
        }
        expect(v.safeParse(addEnumOperationSchema, operation).success).toBe(
          true,
        )
      }
    })

    it('should reject invalid enum base paths', () => {
      const invalidPaths = [
        '/enums',
        '/enums/',
        '/enums/status/name',
        '/tables/users',
        '/enum/status',
      ]

      for (const path of invalidPaths) {
        const operation = {
          op: 'add' as const,
          path,
          value: { name: 'test', values: ['a'], comment: null },
        }
        expect(v.safeParse(addEnumOperationSchema, operation).success).toBe(
          false,
        )
      }
    })

    it('should match valid enum property paths', () => {
      const validNamePaths = [
        '/enums/status/name',
        '/enums/user_role/name',
        '/enums/priority/name',
      ]
      const validValuesPaths = [
        '/enums/status/values',
        '/enums/user_role/values',
        '/enums/priority/values',
      ]
      const validCommentPaths = [
        '/enums/status/comment',
        '/enums/user_role/comment',
        '/enums/priority/comment',
      ]

      for (const path of validNamePaths) {
        const operation = { op: 'replace' as const, path, value: 'new_name' }
        expect(
          v.safeParse(replaceEnumNameOperationSchema, operation).success,
        ).toBe(true)
      }

      for (const path of validValuesPaths) {
        const operation = {
          op: 'replace' as const,
          path,
          value: ['value1', 'value2'],
        }
        expect(
          v.safeParse(replaceEnumValuesOperationSchema, operation).success,
        ).toBe(true)
      }

      for (const path of validCommentPaths) {
        const operation = {
          op: 'replace' as const,
          path,
          value: 'A comment',
        }
        expect(
          v.safeParse(replaceEnumCommentOperationSchema, operation).success,
        ).toBe(true)
      }
    })
  })
})
