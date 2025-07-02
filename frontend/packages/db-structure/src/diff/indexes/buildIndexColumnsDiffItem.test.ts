import type { Operation } from 'fast-json-patch'
import { describe, expect, it } from 'vitest'
import { anIndex, aSchema } from '../../schema/factories.js'
import type { Schema } from '../../schema/index.js'
import { buildIndexColumnsDiffItem } from './buildIndexColumnsDiffItem.js'

describe('buildIndexColumnsDiffItem', () => {
  const tableId = 'users'
  const indexId = 'idx_users_email'

  const createSchemaWithIndex = (indexColumns: string[]): Schema => {
    return aSchema({
      tables: {
        [tableId]: {
          name: tableId,
          comment: null,
          columns: {},
          constraints: {},
          indexes: {
            [indexId]: anIndex({
              name: indexId,
              columns: indexColumns,
              unique: false,
              type: 'btree',
            }),
          },
        },
      },
    })
  }

  describe('when status is unchanged', () => {
    it('should return null when no operations affect the index columns', () => {
      const before = createSchemaWithIndex(['email'])
      const after = createSchemaWithIndex(['email'])
      const operations: Operation[] = []

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toBeNull()
    })

    it('should return null when operations do not match the index columns path', () => {
      const before = createSchemaWithIndex(['email'])
      const after = createSchemaWithIndex(['email'])
      const operations: Operation[] = [
        {
          op: 'replace',
          path: `/tables/${tableId}/indexes/${indexId}/name`,
          value: 'new_name',
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toBeNull()
    })
  })

  describe('when status is added', () => {
    it('should return IndexColumnsDiffItem with added status and data from after schema', () => {
      const before = aSchema({ tables: {} })
      const after = createSchemaWithIndex(['email', 'name'])
      const operations: Operation[] = [
        {
          op: 'add',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['email', 'name'],
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toEqual({
        kind: 'index-columns',
        status: 'added',
        data: ['email', 'name'],
        tableId,
        indexId,
      })
    })
  })

  describe('when status is removed', () => {
    it('should return IndexColumnsDiffItem with removed status and data from before schema', () => {
      const before = createSchemaWithIndex(['email', 'name'])
      const after = aSchema({ tables: {} })
      const operations: Operation[] = [
        {
          op: 'remove',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toEqual({
        kind: 'index-columns',
        status: 'removed',
        data: ['email', 'name'],
        tableId,
        indexId,
      })
    })
  })

  describe('when status is modified', () => {
    it('should return IndexColumnsDiffItem with modified status when columns are replaced', () => {
      const before = createSchemaWithIndex(['email'])
      const after = createSchemaWithIndex(['email', 'name'])
      const operations: Operation[] = [
        {
          op: 'replace',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['email', 'name'],
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toEqual({
        kind: 'index-columns',
        status: 'modified',
        data: ['email', 'name'],
        tableId,
        indexId,
      })
    })

    it('should return IndexColumnsDiffItem with modified status when both add and remove operations exist', () => {
      const before = createSchemaWithIndex(['email'])
      const after = createSchemaWithIndex(['name'])
      const operations: Operation[] = [
        {
          op: 'add',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['name'],
        },
        {
          op: 'remove',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toEqual({
        kind: 'index-columns',
        status: 'modified',
        data: ['name'],
        tableId,
        indexId,
      })
    })
  })

  describe('edge cases', () => {
    it('should return null when table does not exist in before schema for removed status', () => {
      const before = aSchema({ tables: {} })
      const after = aSchema({ tables: {} })
      const operations: Operation[] = [
        {
          op: 'remove',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toBeNull()
    })

    it('should return null when index does not exist in before schema for removed status', () => {
      const before = aSchema({
        tables: {
          [tableId]: {
            name: tableId,
            comment: null,
            columns: {},
            constraints: {},
            indexes: {},
          },
        },
      })
      const after = aSchema({ tables: {} })
      const operations: Operation[] = [
        {
          op: 'remove',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toBeNull()
    })

    it('should return null when table does not exist in after schema for added status', () => {
      const before = aSchema({ tables: {} })
      const after = aSchema({ tables: {} })
      const operations: Operation[] = [
        {
          op: 'add',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['email'],
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toBeNull()
    })

    it('should return null when index does not exist in after schema for added status', () => {
      const before = aSchema({ tables: {} })
      const after = aSchema({
        tables: {
          [tableId]: {
            name: tableId,
            comment: null,
            columns: {},
            constraints: {},
            indexes: {},
          },
        },
      })
      const operations: Operation[] = [
        {
          op: 'add',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['email'],
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toBeNull()
    })

    it('should handle empty columns array', () => {
      const before = createSchemaWithIndex([])
      const after = createSchemaWithIndex(['email'])
      const operations: Operation[] = [
        {
          op: 'replace',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['email'],
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toEqual({
        kind: 'index-columns',
        status: 'modified',
        data: ['email'],
        tableId,
        indexId,
      })
    })

    it('should handle multiple column changes', () => {
      const before = createSchemaWithIndex(['email', 'name'])
      const after = createSchemaWithIndex(['email', 'name', 'created_at'])
      const operations: Operation[] = [
        {
          op: 'replace',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['email', 'name', 'created_at'],
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toEqual({
        kind: 'index-columns',
        status: 'modified',
        data: ['email', 'name', 'created_at'],
        tableId,
        indexId,
      })
    })
  })

  describe('operations filtering', () => {
    it('should only consider operations that match the specific table and index', () => {
      const before = createSchemaWithIndex(['email'])
      const after = createSchemaWithIndex(['email', 'name'])
      const operations: Operation[] = [
        // This operation should be ignored (different table)
        {
          op: 'add',
          path: '/tables/other_table/indexes/idx_other/columns',
          value: ['other_column'],
        },
        // This operation should be ignored (different index)
        {
          op: 'add',
          path: `/tables/${tableId}/indexes/other_index/columns`,
          value: ['other_column'],
        },
        // This operation should be considered
        {
          op: 'replace',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['email', 'name'],
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toEqual({
        kind: 'index-columns',
        status: 'modified',
        data: ['email', 'name'],
        tableId,
        indexId,
      })
    })

    it('should ignore operations that do not match the exact columns path pattern', () => {
      const before = createSchemaWithIndex(['email'])
      const after = createSchemaWithIndex(['email'])
      const operations: Operation[] = [
        // These operations should be ignored (not exact columns path)
        {
          op: 'replace',
          path: `/tables/${tableId}/indexes/${indexId}/columns/0`,
          value: 'name',
        },
        {
          op: 'add',
          path: `/tables/${tableId}/indexes/${indexId}/columns_extra`,
          value: ['extra'],
        },
        {
          op: 'remove',
          path: `/tables/${tableId}/indexes/${indexId}/name`,
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toBeNull()
    })
  })

  describe('complex scenarios', () => {
    it('should handle single column index', () => {
      const before = createSchemaWithIndex(['id'])
      const after = createSchemaWithIndex(['uuid'])
      const operations: Operation[] = [
        {
          op: 'replace',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['uuid'],
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toEqual({
        kind: 'index-columns',
        status: 'modified',
        data: ['uuid'],
        tableId,
        indexId,
      })
    })

    it('should handle composite index with many columns', () => {
      const before = createSchemaWithIndex(['col1', 'col2', 'col3'])
      const after = createSchemaWithIndex([
        'col1',
        'col2',
        'col3',
        'col4',
        'col5',
      ])
      const operations: Operation[] = [
        {
          op: 'replace',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['col1', 'col2', 'col3', 'col4', 'col5'],
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toEqual({
        kind: 'index-columns',
        status: 'modified',
        data: ['col1', 'col2', 'col3', 'col4', 'col5'],
        tableId,
        indexId,
      })
    })

    it('should handle reordering of columns', () => {
      const before = createSchemaWithIndex(['email', 'name', 'created_at'])
      const after = createSchemaWithIndex(['name', 'email', 'created_at'])
      const operations: Operation[] = [
        {
          op: 'replace',
          path: `/tables/${tableId}/indexes/${indexId}/columns`,
          value: ['name', 'email', 'created_at'],
        },
      ]

      const result = buildIndexColumnsDiffItem(
        tableId,
        indexId,
        before,
        after,
        operations,
      )

      expect(result).toEqual({
        kind: 'index-columns',
        status: 'modified',
        data: ['name', 'email', 'created_at'],
        tableId,
        indexId,
      })
    })
  })
})
