import { 
  aColumn, 
  aForeignKeyConstraint, 
  aSchema, 
  aTable,
  aPrimaryKeyConstraint,
  constraintsToRelationships
} from '@liam-hq/db-structure'

// Test composite foreign key scenario
const schema = aSchema({
  tables: {
    regions: aTable({
      name: 'regions',
      columns: {
        country_code: aColumn({ name: 'country_code', type: 'varchar' }),
        region_code: aColumn({ name: 'region_code', type: 'varchar' }),
        region_name: aColumn({ name: 'region_name', type: 'varchar' }),
      },
      constraints: {
        pk_regions: aPrimaryKeyConstraint({
          name: 'pk_regions',
          columnNames: ['country_code', 'region_code'],
        }),
      },
    }),
    stores: aTable({
      name: 'stores',
      columns: {
        store_id: aColumn({ name: 'store_id', type: 'integer' }),
        store_name: aColumn({ name: 'store_name', type: 'varchar' }),
        country_code: aColumn({ name: 'country_code', type: 'varchar' }),
        region_code: aColumn({ name: 'region_code', type: 'varchar' }),
      },
      constraints: {
        pk_stores: aPrimaryKeyConstraint({
          name: 'pk_stores',
          columnNames: ['store_id'],
        }),
        fk_stores_region: aForeignKeyConstraint({
          name: 'fk_stores_region',
          columnNames: ['country_code', 'region_code'],
          targetTableName: 'regions',
          targetColumnNames: ['country_code', 'region_code'],
        }),
      },
    }),
  },
})

// Check relationships
const relationships = constraintsToRelationships(schema.tables)
console.log('Relationships:', Object.keys(relationships))
console.log('Number of relationships:', Object.keys(relationships).length)
console.log('\nRelationship details:')
for (const [key, rel] of Object.entries(relationships)) {
  console.log(`  ${key}: ${rel.foreignTableName}.${rel.foreignColumnName} -> ${rel.primaryTableName}.${rel.primaryColumnName}`)
}