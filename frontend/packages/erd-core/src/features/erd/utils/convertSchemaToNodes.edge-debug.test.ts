import { aColumn, aSchema, aTable } from '@liam-hq/db-structure'
import { describe, expect, it } from 'vitest'
import { convertSchemaToNodes } from './convertSchemaToNodes'

describe('convertSchemaToNodes - Edge Debug', () => {
  it('should create visible edges for composite foreign keys', () => {
    const schema = aSchema({
      tables: {
        regions: aTable({
          name: 'regions',
          columns: {
            country_code: aColumn({ name: 'country_code', type: 'varchar' }),
            region_code: aColumn({ name: 'region_code', type: 'varchar' }),
          },
        }),
        stores: aTable({
          name: 'stores',
          columns: {
            country_code: aColumn({ name: 'country_code', type: 'varchar' }),
            region_code: aColumn({ name: 'region_code', type: 'varchar' }),
          },
          constraints: {
            fk_store_region: {
              type: 'FOREIGN KEY',
              name: 'fk_store_region',
              columnNames: ['country_code', 'region_code'],
              targetTableName: 'regions',
              targetColumnNames: ['country_code', 'region_code'],
              updateConstraint: 'NO_ACTION',
              deleteConstraint: 'CASCADE',
            },
          },
        }),
      },
    })

    const { edges } = convertSchemaToNodes({
      schema,
      showMode: 'ALL_FIELDS',
    })

    console.log('Generated edges:', JSON.stringify(edges, null, 2))

    // Should create 2 edges
    expect(edges).toHaveLength(2)
    
    // Check both edges exist
    const countryCodeEdge = edges.find(e => e.id === 'fk_store_region_0')
    const regionCodeEdge = edges.find(e => e.id === 'fk_store_region_1')
    
    expect(countryCodeEdge).toBeDefined()
    expect(regionCodeEdge).toBeDefined()
    
    // Check handles are different
    expect(countryCodeEdge?.sourceHandle).toBe('regions-country_code')
    expect(countryCodeEdge?.targetHandle).toBe('stores-country_code')
    expect(regionCodeEdge?.sourceHandle).toBe('regions-region_code')
    expect(regionCodeEdge?.targetHandle).toBe('stores-region_code')
    
    // Check offsets are applied
    expect(countryCodeEdge?.data?.['pathOffset']).toBe(-50)
    expect(regionCodeEdge?.data?.['pathOffset']).toBe(50)
  })
})