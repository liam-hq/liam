# Tool Interface Contract: saveDmlOperationsTool

## Input Contract

- Uses existing `dmlOperationSchema` without changes
- Each `sql` field MUST pass `pgParse` syntax validation internally

## Output Contract

- **Success**: Returns `Command` with saved operations via existing pattern
- **Error**: Tool throws `Error` with descriptive message - LangGraph handles conversion to `ToolMessage`

## Validation Behavior

1. Tool validates ALL SQL before saving ANY operations
2. First validation failure → throw `Error` immediately
3. All valid → save operations and return success
4. Error messages MUST be clear enough for LLM self-healing

## Dependencies

- `@liam-hq/schema/parser` for `pgParse`
- `@langchain/core` for tool framework
- `valibot` for existing schema validation

## Test Requirements

### Valid Cases

- Valid SQL → Operations saved successfully
- Multiple valid operations → All saved

### Invalid Cases

- Syntax error → `Error` thrown, no operations saved
- Empty/malformed SQL → `Error` thrown

### Verification

- No operations saved when validation fails
- All operations saved when validation passes
- Clear error messages enable LLM regeneration
