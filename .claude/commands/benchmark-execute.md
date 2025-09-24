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

**Critical**: When executing LiamDB benchmarks, use a 30-minute (1800-second) timeout to prevent premature termination. The deep modeling workflow can take 10+ minutes per test case.

First, I'll clean up any existing workspace and set up a fresh benchmark environment with multiple datasets:

```bash
rm -rf benchmark-workspace && pnpm --filter @liam-hq/schema-bench setupWorkspace
```

This will set up four benchmark datasets:
- **default**: Standard schema generation benchmark (3 complex cases)
- **entity-extraction**: Tests if specified table/column names appear in output (5 cases)
- **ambiguous-recall**: Measures recall of core tables from an ambiguous prompt. Uses the same input across 3 cases with different expected schemas (3/5/10 tables) to evaluate robustness.
- **logical-deletion**: Evaluates account deletion design without naive `is_deleted`. Focuses on PII separation, referential integrity for orders, legal retention/holds, closure reasons, and auditability.

The system features:
- **Parallel Processing**: Datasets are processed simultaneously for faster execution
- **Smart Concurrency**: Each dataset uses MAX_CONCURRENT=5 for stability
- **Input Standardization**: Entity-extraction inputs are automatically wrapped in `{"input": "..."}` format

Next, I'll execute the specified model with dataset selection:

{{#if (eq (lower model) "liamdb")}}
```bash
# Run LiamDB on all datasets in the workspace
pnpm --filter @liam-hq/schema-bench executeLiamDB -all

# Run LiamDB on a specific dataset
pnpm --filter @liam-hq/schema-bench executeLiamDB -entity-extraction

# Run LiamDB on the ambiguous-recall dataset only
pnpm --filter @liam-hq/schema-bench executeLiamDB -ambiguous-recall

# Run LiamDB on the logical-deletion dataset only
pnpm --filter @liam-hq/schema-bench executeLiamDB -logical-deletion

# Run LiamDB on multiple datasets
pnpm --filter @liam-hq/schema-bench executeLiamDB -default -entity-extraction -ambiguous-recall -logical-deletion
```
{{else if (eq (lower model) "openai")}}
```bash
# OpenAI currently targets the default dataset
pnpm --filter @liam-hq/schema-bench executeOpenai
```
{{else}}
**Error**: Invalid model specified. Please use 'LiamDB' or 'OpenAI'.
{{/if}}

If execution succeeds, I'll run the evaluation on all datasets:

```bash
pnpm --filter @liam-hq/schema-bench evaluateSchemaMulti
```

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
- **Logical-deletion dataset**: Focus is on correct separation of PII from business entities, appropriate FK delete policies, and inclusion of closure/audit workflows; metrics reflect structural accuracy rather than text guidance.

### Execution Time:
- Setup: ~5 seconds
- LiamDB execution: ~20-30 minutes for all cases (adds 3 more with ambiguous-recall)
- Evaluation: ~10 seconds
