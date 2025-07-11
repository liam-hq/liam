# Composite Foreign Key Edge Display Issue

## Problem
When a composite foreign key creates multiple edges between the same tables, only the last edge is visible in the ERD. The first edge disappears.

## Root Cause
The current implementation creates multiple relationships (one per column pair) for composite foreign keys:
- `fk_stores_region_0` for country_code -> country_code
- `fk_stores_region_1` for region_code -> region_code

Both edges have the same source and target nodes, causing them to overlap in the visualization.

## Potential Solutions

### Option 1: Custom Edge Path Calculation
Modify the RelationshipEdge component to offset multiple edges between the same nodes:

```typescript
// In RelationshipEdge.tsx
const [edgePath] = getBezierPath({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  // Add curvature to separate multiple edges
  curvature: calculateCurvature(id, allEdgesBetweenSameNodes),
})
```

### Option 2: Single Edge with Composite Information
Instead of creating multiple edges, create a single edge that represents the entire composite foreign key:

1. Modify `constraintsToRelationships` to create only one relationship per foreign key
2. Add arrays to the Relationship type to store multiple column pairs:
   ```typescript
   type Relationship = {
     name: string
     primaryTableName: string
     primaryColumnNames: string[]  // Changed to array
     foreignTableName: string
     foreignColumnNames: string[]  // Changed to array
     cardinality: Cardinality
     // ...
   }
   ```

### Option 3: Edge Grouping
Group multiple edges between the same tables and render them as a single visual element with multiple labels.

## Recommendation
Option 2 is the most semantically correct - a composite foreign key is a single constraint and should be represented as a single edge in the ERD. However, this requires changes to the Relationship type structure.

For a quick fix, Option 1 can be implemented in the ERD-core package without changing the db-structure package.