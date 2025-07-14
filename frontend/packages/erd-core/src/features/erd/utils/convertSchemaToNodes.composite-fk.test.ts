import { aColumn, aSchema, aTable } from '@liam-hq/db-structure'
import { describe, expect, it } from 'vitest'
import { convertSchemaToNodes } from './convertSchemaToNodes'

describe('convertSchemaToNodes - Composite Foreign Keys', () => {
  it('should create multiple edges for composite foreign keys', () => {
    const schema = aSchema({
      tables: {
        regions: aTable({
          name: 'regions',
          columns: {
            country_code: aColumn({ name: 'country_code', type: 'varchar' }),
            region_code: aColumn({ name: 'region_code', type: 'varchar' }),
          },
          constraints: {
            pk_regions: {
              type: 'PRIMARY KEY',
              name: 'pk_regions',
              columnNames: ['country_code', 'region_code'],
            },
          },
        }),
        stores: aTable({
          name: 'stores',
          columns: {
            store_id: aColumn({ name: 'store_id', type: 'integer' }),
            country_code: aColumn({ name: 'country_code', type: 'varchar' }),
            region_code: aColumn({ name: 'region_code', type: 'varchar' }),
          },
          constraints: {
            pk_stores: {
              type: 'PRIMARY KEY',
              name: 'pk_stores',
              columnNames: ['store_id'],
            },
            fk_stores_region: {
              type: 'FOREIGN KEY',
              name: 'fk_stores_region',
              columnNames: ['country_code', 'region_code'],
              targetTableName: 'regions',
              targetColumnNames: ['country_code', 'region_code'],
              updateConstraint: 'NO_ACTION',
              deleteConstraint: 'NO_ACTION',
            },
          },
        }),
      },
    })

    const { edges } = convertSchemaToNodes({
      schema,
      showMode: 'ALL_FIELDS',
    })

    // Should create 2 edges for composite foreign key
    expect(edges).toHaveLength(2)

    // First edge for country_code
    expect(edges[0]).toEqual({
      id: 'fk_stores_region_0',
      type: 'relationship',
      source: 'regions',
      target: 'stores',
      sourceHandle: 'regions-country_code',
      targetHandle: 'stores-country_code',
      data: {
        relationship: expect.objectContaining({
          name: 'fk_stores_region_0',
          primaryColumnName: 'country_code',
          foreignColumnName: 'country_code',
        }),
        cardinality: 'ONE_TO_MANY',
        pathOffset: -25,
        edgeIndex: 0,
        totalEdgesInGroup: 2,
      },
    })

    // Second edge for region_code
    expect(edges[1]).toEqual({
      id: 'fk_stores_region_1',
      type: 'relationship',
      source: 'regions',
      target: 'stores',
      sourceHandle: 'regions-region_code',
      targetHandle: 'stores-region_code',
      data: {
        relationship: expect.objectContaining({
          name: 'fk_stores_region_1',
          primaryColumnName: 'region_code',
          foreignColumnName: 'region_code',
        }),
        cardinality: 'ONE_TO_MANY',
        pathOffset: 25,
        edgeIndex: 1,
        totalEdgesInGroup: 2,
      },
    })

    // Both edges have the same source and target tables
    expect(edges[0]?.source).toBe(edges[1]?.source)
    expect(edges[0]?.target).toBe(edges[1]?.target)

    // But different handles (connection points)
    expect(edges[0]?.sourceHandle).not.toBe(edges[1]?.sourceHandle)
    expect(edges[0]?.targetHandle).not.toBe(edges[1]?.targetHandle)

    // Check that path offsets are applied to separate the edges
    expect(edges[0]?.data?.['pathOffset']).toBe(-50) // First edge offset left
    expect(edges[1]?.data?.['pathOffset']).toBe(50) // Second edge offset right
  })
})
