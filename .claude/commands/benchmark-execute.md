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

**Important**: Benchmark operations are time-intensive. The system now supports:
- Parallel dataset processing for faster execution
- Automatic input format standardization
- Improved error handling and progress reporting

First, I'll clean up any existing workspace and set up a fresh benchmark environment with multiple datasets:

```bash
rm -rf benchmark-workspace && pnpm --filter @liam-hq/schema-bench setupWorkspace
```

This will set up three benchmark datasets:
- **default**: Standard schema generation benchmark (3 complex cases)
- **entity-extraction**: Tests if specified table/column names appear in output (5 cases)
- **ambiguous-recall**: Measures recall of core tables from an ambiguous prompt. Uses the same input across 3 cases with different expected schemas (3/5/10 tables) to evaluate robustness.

The system features:
- **Parallel Processing**: Datasets are processed simultaneously for faster execution
- **Smart Concurrency**: Each dataset uses MAX_CONCURRENT=5 for stability
- **Input Standardization**: Entity-extraction inputs are automatically wrapped in `{"input": "..."}` format

Next, I'll execute the specified model with dataset selection. The unified CLI is recommended; legacy scripts remain available and unchanged:

{{#if (eq (lower model) "liamdb")}}
```bash
# Unified CLI (recommended): Liam on all datasets
pnpm -F @liam-hq/schema-bench schema-bench execute --executor liam -all

# Unified CLI: run specific datasets
pnpm -F @liam-hq/schema-bench schema-bench execute --executor liam -entity-extraction
pnpm -F @liam-hq/schema-bench schema-bench execute --executor liam -ambiguous-recall
pnpm -F @liam-hq/schema-bench schema-bench execute --executor liam -default -entity-extraction -ambiguous-recall

# Optional: control DB agent reasoning effort (Liam only)
# Accepted values: off | minimal | low | medium | high (default: medium)
# Examples:
#   via flag
pnpm -F @liam-hq/schema-bench schema-bench execute --executor liam --liam-db-effort minimal -all
#   via env var (same accepted values)
LIAM_DB_EFFORT=high pnpm -F @liam-hq/schema-bench schema-bench execute --executor liam -all

# Notes:
# - Aliases: none/disabled => off, max/maximum => high
# - The effort setting can influence latency and output quality.

# Legacy (still supported):
pnpm -F @liam-hq/schema-bench executeLiamDB -all
pnpm -F @liam-hq/schema-bench executeLiamDB -entity-extraction
pnpm -F @liam-hq/schema-bench executeLiamDB -ambiguous-recall
pnpm -F @liam-hq/schema-bench executeLiamDB -default -entity-extraction -ambiguous-recall
```
{{else if (eq (lower model) "openai")}}
```bash
# Unified CLI (recommended): OpenAI currently targets the default dataset
pnpm -F @liam-hq/schema-bench schema-bench execute --executor openai

# Legacy (still supported):
pnpm -F @liam-hq/schema-bench executeOpenai
```
{{else}}
**Error**: Invalid model specified. Please use 'LiamDB' or 'OpenAI'.
{{/if}}

If execution succeeds, I'll run the evaluation on all datasets:

```bash
# Unified CLI (recommended)
pnpm -F @liam-hq/schema-bench schema-bench evaluate

# Legacy (still supported)
pnpm -F @liam-hq/schema-bench evaluateSchemaMulti
```

Note: For OpenAI execution, ensure `OPENAI_API_KEY` is set in your environment.

The evaluation will display comprehensive metrics for each dataset:

**For each dataset:**
- **Table F1 Score**: Harmonic mean of table precision and recall
- **Table Recall**: How many reference tables were found
- **Table All Correct Rate**: Percentage of perfectly matched tables
- **Column F1 Score Average**: Average F1 score across all tables' columns
- **Column Recall Average**: How many reference columns were found
- **Column All Correct Rate Average**: Percentage of perfectly matched columns
- **Primary Key Accuracy Average**: Accuracy of primary key identification
- **Constraint Accuracy**: Accuracy of constraint detection
- **Foreign Key F1 Score**: F1 score for foreign key relationships
- **Foreign Key Recall**: How many reference foreign keys were found
- **Foreign Key All Correct Rate**: Percentage of perfectly matched foreign keys
- **Overall Schema Accuracy**: Combined accuracy across all metrics

### Expected Performance:
- **Default dataset**: ~60-80% overall accuracy for complex schemas
- **Entity-extraction dataset**: ~100% recall for mentioned entities
- **Ambiguous-recall dataset**: Focuses on table recall from a vague prompt; primary metric is how many core tables are retrieved across 3/5/10-table references.

### Execution Time:
- Setup: ~5 seconds
- LiamDB execution: ~20-30 minutes for all cases (adds 3 more with ambiguous-recall)
- Evaluation: ~10 seconds
