import type { Relationships, Tables } from '../../schema/index.js'
import { hasUniqueConstraint } from './hasUniqueConstraint.js'

// If there is a unique index for a column in relationships, make it `ONE_TO_ONE` cardinality.
export const handleOneToOneRelationships = (
  tables: Tables,
  relationships: Relationships,
) => {
  for (const relationship of Object.values(relationships)) {
    const foreignTable = tables[relationship.foreignTableName]

    if (
      foreignTable &&
      hasUniqueConstraint(
        foreignTable.constraints,
        relationship.foreignColumnName,
      )
    ) {
      relationship.cardinality = 'ONE_TO_ONE'
    }
  }
}
