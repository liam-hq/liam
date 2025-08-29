---
description: Execute schema benchmark for specified model (LiamDB or OpenAI)
---

# Benchmark Command

Execute schema benchmark comparison between LiamDB and OpenAI models.

## Arguments
- `model`: Target model to benchmark (LiamDB or OpenAI, case-insensitive)

## Usage
```
/benchmark-execute LiamDB
/benchmark-execute openai
```

## Execution

**Important**: When using the Bash tool for these commands, always set the timeout parameter to the maximum value (600000ms / 10 minutes) as benchmark operations can be time-intensive.

First, I'll clean up any existing workspace and set up a fresh benchmark environment with multiple datasets:

```bash
rm -rf benchmark-workspace && pnpm --filter @liam-hq/schema-bench setupWorkspace
```

This will set up two benchmark datasets:
- **default**: Standard schema generation benchmark
- **entity-extraction**: Tests if specified table/column names appear in output

Next, I'll execute the specified model on all datasets:

{{#if (eq (lower model) "liamdb")}}
```bash
pnpm --filter @liam-hq/schema-bench executeLiamDBMulti
```
{{else if (eq (lower model) "openai")}}
```bash
pnpm --filter @liam-hq/schema-bench executeOpenai
```
{{else}}
**Error**: Invalid model specified. Please use 'LiamDB' or 'OpenAI'.
{{/if}}

If execution succeeds, I'll run the evaluation on all datasets:

```bash
pnpm --filter @liam-hq/schema-bench evaluateSchemaMulti
```

The evaluation will display results for each dataset separately, showing:

**For each dataset:**
- Table F1 Score
- Table Recall (how many reference tables were found)
- Table All Correct Rate
- Column F1 Score Average
- Column Recall Average (how many reference columns were found)
- Column All Correct Rate Average
- Primary Key Accuracy Average
- Constraint Accuracy
- Foreign Key F1 Score
- Foreign Key Recall
- Foreign Key All Correct Rate
- Overall Schema Accuracy

Results are displayed separately for:
1. **Default dataset**: Full schema generation accuracy
2. **Entity-extraction dataset**: Accuracy of extracting mentioned table/column names
