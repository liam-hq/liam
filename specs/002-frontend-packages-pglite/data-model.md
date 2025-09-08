# Data Model: SQL Syntax Validation

## Implementation Approach

This feature requires no new data models or schema changes. The implementation is purely internal tool logic enhancement using existing `pgParse` from `@liam-hq/schema/parser`.

## Validation Flow

### Tool Validation Process

1. Tool receives DML operations via existing schema
2. For each operation's SQL: call `pgParse` for syntax validation
3. If validation fails: throw `Error` with descriptive message
4. If all valid: save operations using existing data structures
5. LangGraph handles error retry automatically

## Error Handling

### Successful Path

1. Tool receives DML operations via existing schema
2. Validate each SQL with `pgParse`
3. All valid → Save operations and return success

### Failed Path

1. Tool receives DML operations
2. `pgParse` validation fails for one or more SQLs
3. Tool throws `Error` with descriptive message about syntax issue
4. LangGraph converts thrown error to ToolMessage automatically
5. LangGraph retries based on its built-in retry mechanism

## Backward Compatibility

### No Schema Changes Required

- Existing DML operations continue to work unchanged
- Tool interface remains the same - validation added internally only
- Execution path can keep optional fallback validation for robustness

This approach requires minimal changes while adding validation at the optimal point in the workflow.
