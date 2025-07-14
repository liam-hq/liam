// Debug script to check what edges are generated
import { constraintsToRelationships } from '@liam-hq/db-structure'

const schema = {
  tables: {
    regions: {
      name: 'regions',
      columns: {},
      constraints: {},
      indexes: {},
      comment: null,
    },
    stores: {
      name: 'stores', 
      columns: {},
      constraints: {
        "fk_store_region": {
          "type": "FOREIGN KEY" as const,
          "name": "fk_store_region",
          "columnNames": [
            "country_code",
            "region_code"
          ],
          "targetTableName": "regions",
          "targetColumnNames": [
            "country_code",
            "region_code"
          ],
          "updateConstraint": "NO_ACTION" as const,
          "deleteConstraint": "CASCADE" as const
        }
      },
      indexes: {},
      comment: null,
    },
  },
}

const relationships = constraintsToRelationships(schema.tables)
console.log('Generated relationships:', JSON.stringify(relationships, null, 2))