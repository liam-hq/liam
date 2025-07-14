# Alternative Solution: Single Edge for Composite Foreign Keys

## Current Problem
When creating multiple edges for composite foreign keys, only the last edge (region_code) is visible. The first edge (country_code) appears to be hidden or not rendered.

## Root Cause Analysis
1. **React Flow Limitation**: React Flow might have issues rendering multiple edges between the same source and target nodes, especially when they share similar paths.
2. **Visual Overlap**: Even with offsets, the edges might be overlapping in a way that makes one invisible.
3. **Handle Connection**: Multiple edges connecting to different handles on the same nodes might not be rendered correctly.

## Alternative Approach: Single Edge Representation

Instead of creating multiple edges for composite foreign keys, we should create a single edge that represents the entire constraint. This is more semantically correct because:

1. A composite foreign key is a single constraint in the database
2. The columns work together as a unit, not independently
3. It avoids the visual complexity of multiple overlapping edges

### Implementation Changes Needed

1. **Modify `constraintsToRelationships`**: 
   - Create only one relationship per foreign key constraint
   - Store all column pairs in arrays within the relationship

2. **Update Relationship Type**:
   ```typescript
   type Relationship = {
     name: string
     primaryTableName: string
     primaryColumnNames: string[]  // Array for composite keys
     foreignTableName: string
     foreignColumnNames: string[]  // Array for composite keys
     cardinality: Cardinality
     // ...
   }
   ```

3. **Update Edge Rendering**:
   - Display composite key information in edge labels or tooltips
   - Connect to a single handle per table (or create a special composite handle)

This approach would be cleaner and avoid the rendering issues we're experiencing.