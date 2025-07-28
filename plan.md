# LangGraph Performance Optimization Plan

## Problem
The `pnpm --filter @liam-hq/agent execute-deep-modeling:memory:debug` command takes too long to execute due to unnecessary nodes in the graph workflow.

## Current Graph Flow
```
START → webSearch → analyzeRequirements → designSchema
                                            ↓ (conditional)
                                         invokeSchemaDesignTool ←→ designSchema (loop)
                                            ↓ (conditional)  
                                         executeDDL → generateUsecase → prepareDML → validateSchema
                                            ↓                                            ↓ (conditional)
                                         finalizeArtifacts ←─────────────────────── designSchema (retry)
                                            ↓
                                           END
```

## Nodes to Remove
1. **webSearch** - Web search functionality that adds latency
2. **executeDDL** - DDL execution step that's time-consuming
3. **generateUsecase** - Use case generation that's not essential
4. **finalizeArtifacts** - Finalization step that can be skipped

## Proposed Optimized Flow
```
START → analyzeRequirements → designSchema
                                 ↓ (conditional)
                              invokeSchemaDesignTool ←→ designSchema (loop)
                                 ↓ (when ready)
                              prepareDML → validateSchema
                                 ↓ (conditional)
                              designSchema (retry) or END
```

## Implementation Steps
1. Remove webSearch node and START → webSearch edge
2. Remove executeDDL node and all related edges/conditions
3. Remove generateUsecase node and related edges
4. Remove finalizeArtifacts node and related edges
5. Update graph flow:
   - START → analyzeRequirements
   - designSchema → prepareDML (when not routing to invokeSchemaDesignTool)
   - validateSchema → END (when successful) or designSchema (when retry needed)

## Expected Benefits
- Reduced execution time by removing 4 time-consuming nodes
- Simplified workflow focusing on core schema design and validation
- Maintains essential functionality while improving performance
