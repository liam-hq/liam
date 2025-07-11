// Debug script to check generated edges for composite foreign keys
import { constraintsToRelationships } from '@liam-hq/db-structure'

const testSchema = {
  tables: {
    regions: {
      name: 'regions',
      columns: {
        country_code: { name: 'country_code', type: 'VARCHAR(2)', notNull: true, default: null, check: null, comment: null },
        region_code: { name: 'region_code', type: 'VARCHAR(3)', notNull: true, default: null, check: null, comment: null },
      },
      constraints: {
        pk_regions: {
          type: 'PRIMARY KEY' as const,
          name: 'pk_regions',
          columnNames: ['country_code', 'region_code'],
        },
      },
      indexes: {},
      comment: null,
    },
    stores: {
      name: 'stores',
      columns: {
        store_id: { name: 'store_id', type: 'INTEGER', notNull: true, default: null, check: null, comment: null },
        country_code: { name: 'country_code', type: 'VARCHAR(2)', notNull: true, default: null, check: null, comment: null },
        region_code: { name: 'region_code', type: 'VARCHAR(3)', notNull: true, default: null, check: null, comment: null },
      },
      constraints: {
        pk_stores: {
          type: 'PRIMARY KEY' as const,
          name: 'pk_stores',
          columnNames: ['store_id'],
        },
        fk_stores_region: {
          type: 'FOREIGN KEY' as const,
          name: 'fk_stores_region',
          columnNames: ['country_code', 'region_code'],
          targetTableName: 'regions',
          targetColumnNames: ['country_code', 'region_code'],
          updateConstraint: 'NO_ACTION' as const,
          deleteConstraint: 'NO_ACTION' as const,
        },
      },
      indexes: {},
      comment: null,
    },
  },
}

const relationships = constraintsToRelationships(testSchema.tables)
console.log('Generated relationships:', relationships)

// Expected output:
// {
//   'fk_stores_region_0': { name: 'fk_stores_region_0', primaryTableName: 'regions', primaryColumnName: 'country_code', ... },
//   'fk_stores_region_1': { name: 'fk_stores_region_1', primaryTableName: 'regions', primaryColumnName: 'region_code', ... }
// }

// This creates 2 edges between regions and stores tables, which might cause UI issues