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

This will set up two benchmark datasets:
- **default**: Standard schema generation benchmark (3 complex cases)
- **entity-extraction**: Tests if specified table/column names appear in output (5 cases)

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

# Run LiamDB on multiple datasets
pnpm --filter @liam-hq/schema-bench executeLiamDB -default -entity-extraction
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

### Execution Time:
- Setup: ~5 seconds
- LiamDB execution: ~20-30 minutes for all 8 cases
- Evaluation: ~10 seconds
