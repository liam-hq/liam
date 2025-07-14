# Composite Foreign Key Edge Rendering Issue Summary

## Issue Description
When a composite foreign key creates multiple edges between tables, only the last edge (region_code) is visible. The first edge (country_code) is not displayed.

## Investigation Results

### What Works Correctly:
1. `constraintsToRelationships` correctly generates multiple relationships (one per column pair)
2. `convertSchemaToNodes` correctly creates multiple edges with different IDs
3. `adjustMultipleEdges` correctly applies offsets and z-index to edges
4. Each edge has different source/target handles

### Current Implementation:
```
Foreign Key: (country_code, region_code) -> (country_code, region_code)
Generated Edges:
- Edge 1: fk_store_region_0 (country_code -> country_code) with offset -50
- Edge 2: fk_store_region_1 (region_code -> region_code) with offset +50
```

## Possible Causes:
1. **React Flow Rendering Issue**: React Flow might have limitations rendering multiple edges between the same nodes, even with different handles
2. **Edge Path Overlap**: Despite offsets, edges might be overlapping due to node positioning
3. **Z-Index Issues**: Even with different z-indices, one edge might be completely hidden

## Recommended Solutions:

### Option 1: Debug React Flow Integration (Quick Fix)
- Add debugging to see which edges are actually rendered
- Try different edge types (smoothstep, step, straight)
- Increase offset values further
- Add explicit styling to differentiate edges

### Option 2: Single Edge for Composite Keys (Correct Fix)
- Modify the system to create ONE edge per foreign key constraint
- Update Relationship type to support arrays of columns
- This is more semantically correct as a composite FK is a single constraint

### Option 3: Custom Edge Rendering
- Create a custom edge component that can display multiple column relationships
- Use edge labels or parallel paths to show composite nature

## Next Steps:
1. Try increasing offsets and adding more visual debugging
2. If that doesn't work, implement single edge solution
3. Consider if this is a React Flow limitation that needs upstream fix