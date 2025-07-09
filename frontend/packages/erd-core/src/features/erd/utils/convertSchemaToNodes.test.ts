import {
  aColumn,
  aForeignKeyConstraint,
  aSchema,
  aTable,
  aUniqueConstraint,
  type Schema,
} from '@liam-hq/db-structure'
import { describe, expect, it } from 'vitest'
import type { ShowMode } from '@/schemas/showMode'
import { NON_RELATED_TABLE_GROUP_NODE_ID, zIndex } from '../constants'
import { convertSchemaToNodes } from './convertSchemaToNodes'

describe('convertSchemaToNodes', () => {
  describe('Basic schema conversion', () => {
    it('should convert a single table to nodes correctly', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
              name: aColumn({ name: 'name', type: 'varchar' }),
            },
          }),
        },
      })

      const { nodes, edges } = convertSchemaToNodes({
        schema,
        showMode: 'ALL_FIELDS' as ShowMode,
      })

      expect(nodes).toHaveLength(2) // NON_RELATED_TABLE_GROUP_NODE + users table
      expect(edges).toHaveLength(0)

      // NON_RELATED_TABLE_GROUP_NODE should be created
      expect(nodes[0]).toEqual({
        id: NON_RELATED_TABLE_GROUP_NODE_ID,
        type: 'nonRelatedTableGroup',
        data: {},
        position: { x: 0, y: 0 },
      })

      // Users table node
      expect(nodes[1]).toEqual({
        id: 'users',
        type: 'table',
        data: {
          table: schema.tables['users'],
          sourceColumnName: undefined,
          targetColumnCardinalities: undefined,
        },
        position: { x: 0, y: 0 },
        ariaLabel: 'users table',
        zIndex: zIndex.nodeDefault,
        parentId: NON_RELATED_TABLE_GROUP_NODE_ID,
      })
    })

    it('should convert multiple tables to node arrays correctly', () => {
      const schema = aSchema({
        tables: {
          users: aTable({ name: 'users' }),
          posts: aTable({ name: 'posts' }),
          comments: aTable({ name: 'comments' }),
        },
      })

      const { nodes } = convertSchemaToNodes({
        schema,
        showMode: 'ALL_FIELDS' as ShowMode,
      })

      expect(nodes).toHaveLength(4) // NON_RELATED_TABLE_GROUP_NODE + 3 tables

      const tableNodes = nodes.filter((node) => node.type === 'table')
      expect(tableNodes).toHaveLength(3)
      expect(tableNodes.map((node) => node.id)).toEqual([
        'users',
        'posts',
        'comments',
      ])
    })
  })

  describe('Relationship and edge generation', () => {
    it('should convert basic relationships to edges correctly', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
            },
          }),
          posts: aTable({
            name: 'posts',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
              user_id: aColumn({ name: 'user_id', type: 'integer' }),
            },
            constraints: {
              posts_user_id_fkey: aForeignKeyConstraint({
                name: 'posts_user_id_fkey',
                columnName: 'user_id',
                targetTableName: 'users',
                targetColumnName: 'id',
              }),
            },
          }),
        },
      })

      const { nodes, edges } = convertSchemaToNodes({
        schema,
        showMode: 'ALL_FIELDS' as ShowMode,
      })

      expect(edges).toHaveLength(1)
      expect(edges[0]).toEqual({
        id: 'posts_user_id_fkey',
        type: 'relationship',
        source: 'users',
        target: 'posts',
        sourceHandle: 'users-id',
        targetHandle: 'posts-user_id',
        data: {
          relationship: expect.objectContaining({
            name: 'posts_user_id_fkey',
            primaryTableName: 'users',
            primaryColumnName: 'id',
            foreignTableName: 'posts',
            foreignColumnName: 'user_id',
            cardinality: 'ONE_TO_MANY',
          }),
          cardinality: 'ONE_TO_MANY',
        },
      })

      // Related tables should not have NON_RELATED_TABLE_GROUP_NODE as parent
      const tableNodes = nodes.filter((node) => node.type === 'table')
      expect(tableNodes.every((node) => !node.parentId)).toBe(true)
    })

    it('should handle multiple relationships correctly', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
            },
          }),
          posts: aTable({
            name: 'posts',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
              user_id: aColumn({ name: 'user_id', type: 'integer' }),
            },
            constraints: {
              posts_user_id_fkey: aForeignKeyConstraint({
                name: 'posts_user_id_fkey',
                columnName: 'user_id',
                targetTableName: 'users',
                targetColumnName: 'id',
              }),
            },
          }),
          comments: aTable({
            name: 'comments',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
              post_id: aColumn({ name: 'post_id', type: 'integer' }),
            },
            constraints: {
              comments_post_id_fkey: aForeignKeyConstraint({
                name: 'comments_post_id_fkey',
                columnName: 'post_id',
                targetTableName: 'posts',
                targetColumnName: 'id',
              }),
            },
          }),
        },
      })

      const { edges } = convertSchemaToNodes({
        schema,
        showMode: 'ALL_FIELDS' as ShowMode,
      })

      expect(edges).toHaveLength(2)
      expect(edges.map((edge) => edge.id)).toEqual([
        'posts_user_id_fkey',
        'comments_post_id_fkey',
      ])
    })

    it('should set ONE_TO_ONE cardinality correctly', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
            },
          }),
          profiles: aTable({
            name: 'profiles',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
              user_id: aColumn({ name: 'user_id', type: 'integer' }),
            },
            constraints: {
              profiles_user_id_fkey: aForeignKeyConstraint({
                name: 'profiles_user_id_fkey',
                columnName: 'user_id',
                targetTableName: 'users',
                targetColumnName: 'id',
              }),
              profiles_user_id_unique: aUniqueConstraint({
                name: 'profiles_user_id_unique',
                columnNames: ['user_id'],
              }),
            },
          }),
        },
      })

      const { edges } = convertSchemaToNodes({
        schema,
        showMode: 'ALL_FIELDS' as ShowMode,
      })

      expect(edges[0]?.data?.['cardinality']).toBe('ONE_TO_ONE')
    })
  })

  describe('ShowMode tests', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({ name: 'id', type: 'integer' }),
          },
        }),
        posts: aTable({
          name: 'posts',
          columns: {
            id: aColumn({ name: 'id', type: 'integer' }),
            user_id: aColumn({ name: 'user_id', type: 'integer' }),
          },
          constraints: {
            posts_user_id_fkey: aForeignKeyConstraint({
              name: 'posts_user_id_fkey',
              columnName: 'user_id',
              targetTableName: 'users',
              targetColumnName: 'id',
            }),
          },
        }),
      },
    })

    it('should set column-level handles correctly in ALL_FIELDS mode', () => {
      const { edges } = convertSchemaToNodes({
        schema,
        showMode: 'ALL_FIELDS' as ShowMode,
      })

      expect(edges[0]?.sourceHandle).toBe('users-id')
      expect(edges[0]?.targetHandle).toBe('posts-user_id')
    })

    it('should set column-level handles correctly in KEY_ONLY mode', () => {
      const { edges } = convertSchemaToNodes({
        schema,
        showMode: 'KEY_ONLY' as ShowMode,
      })

      expect(edges[0]?.sourceHandle).toBe('users-id')
      expect(edges[0]?.targetHandle).toBe('posts-user_id')
    })

    it('should set handles to null in TABLE_NAME mode', () => {
      const { edges } = convertSchemaToNodes({
        schema,
        showMode: 'TABLE_NAME' as ShowMode,
      })

      expect(edges[0]?.sourceHandle).toBeNull()
      expect(edges[0]?.targetHandle).toBeNull()
    })
  })

  describe('Non-related table group processing', () => {
    it('should not create group node when all tables are related', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
            },
          }),
          posts: aTable({
            name: 'posts',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
              user_id: aColumn({ name: 'user_id', type: 'integer' }),
            },
            constraints: {
              posts_user_id_fkey: aForeignKeyConstraint({
                name: 'posts_user_id_fkey',
                columnName: 'user_id',
                targetTableName: 'users',
                targetColumnName: 'id',
              }),
            },
          }),
        },
      })

      const { nodes } = convertSchemaToNodes({
        schema,
        showMode: 'ALL_FIELDS' as ShowMode,
      })

      const groupNode = nodes.find(
        (node) => node.id === NON_RELATED_TABLE_GROUP_NODE_ID,
      )
      expect(groupNode).toBeUndefined()

      const tableNodes = nodes.filter((node) => node.type === 'table')
      expect(tableNodes.every((node) => !node.parentId)).toBe(true)
    })
  })

  describe('Edge cases and boundary value tests', () => {
    it('should handle empty schema correctly', () => {
      const schema: Schema = { tables: {} }

      const { nodes, edges } = convertSchemaToNodes({
        schema,
        showMode: 'ALL_FIELDS' as ShowMode,
      })

      expect(nodes).toHaveLength(0)
      expect(edges).toHaveLength(0)
    })

    it('should handle self-referencing tables correctly', () => {
      const schema = aSchema({
        tables: {
          categories: aTable({
            name: 'categories',
            columns: {
              id: aColumn({ name: 'id', type: 'integer' }),
              parent_id: aColumn({ name: 'parent_id', type: 'integer' }),
            },
            constraints: {
              categories_parent_id_fkey: aForeignKeyConstraint({
                name: 'categories_parent_id_fkey',
                columnName: 'parent_id',
                targetTableName: 'categories',
                targetColumnName: 'id',
              }),
            },
          }),
        },
      })

      const { nodes, edges } = convertSchemaToNodes({
        schema,
        showMode: 'ALL_FIELDS' as ShowMode,
      })

      expect(edges).toHaveLength(1)
      expect(edges[0]?.source).toBe('categories')
      expect(edges[0]?.target).toBe('categories')
      expect(edges[0]?.sourceHandle).toBe('categories-id')
      expect(edges[0]?.targetHandle).toBe('categories-parent_id')

      // Self-referencing table should not have NON_RELATED_TABLE_GROUP_NODE as parent
      const tableNodes = nodes.filter((node) => node.type === 'table')
      expect(tableNodes[0]?.parentId).toBeUndefined()
    })
  })
})
