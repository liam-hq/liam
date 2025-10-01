# Schema-Bench Package

## Overview

Schema-Bench benchmarks database schema generation and evaluation across models (LiamDB, OpenAI). It provides executors for generating schemas and tools for evaluating outputs against reference schemas across multiple datasets.

## Quick Start

### 1) Clean and set up workspace (multiple datasets)
```bash
rm -rf benchmark-workspace && pnpm --filter @liam-hq/schema-bench setupWorkspace
```
This creates a benchmark workspace with multiple datasets:
- default: Standard schema generation (3 complex cases)
- entity-extraction: Checks whether specified table/column names appear (5 cases)
- ambiguous-recall: Tests recall/search over ambiguous instructions
- relational-inference: Evaluates implicit relationship inference (1:N, M:N, entity separation)
- logical-deletion: Evaluates designs that avoid naive is_deleted and separate PII from business references

System features:
- Parallel dataset processing for faster execution
- Smart concurrency per dataset (MAX_CONCURRENT=5)
- Automatic input standardization (strings get wrapped to `{ "input": "..." }`)

### 2) Execute a model

LiamDB:
```bash
# Run on all datasets in the workspace
pnpm --filter @liam-hq/schema-bench executeLiamDB -all

# Run on a specific dataset
pnpm --filter @liam-hq/schema-bench executeLiamDB -entity-extraction

# Run on multiple datasets
pnpm --filter @liam-hq/schema-bench executeLiamDB -default -entity-extraction -relational-inference -logical-deletion
```

OpenAI:
```bash
# Run on all datasets in the workspace
pnpm --filter @liam-hq/schema-bench executeOpenai -all

# Run on a specific dataset
pnpm --filter @liam-hq/schema-bench executeOpenai -entity-extraction

# Run on multiple datasets
pnpm --filter @liam-hq/schema-bench executeOpenai -default -entity-extraction -logical-deletion
```

### 3) Evaluate results (all datasets)
```bash
pnpm --filter @liam-hq/schema-bench evaluateSchemaMulti
```

### Execution time (rough guide)
- Setup: ~5s
- LiamDB execution (all 8 cases): ~20–30m
- Evaluation: ~10s

## Available Commands

- setupWorkspace: Initialize benchmark workspace with datasets
- executeLiamDB: Unified executor with dataset flags (`-all`, `-default`, `-entity-extraction`)
- executeOpenai: Unified executor with dataset flags (`-all`, `-default`, `-entity-extraction`)
- evaluateSchemaMulti: Evaluate all available datasets

Note: Legacy dataset-specific scripts exist but the unified `executeLiamDB` is recommended.

## Executors

### OpenAI Executor
- Uses OpenAI models to generate schemas from natural language prompts
- Requires `OPENAI_API_KEY` in your environment
- Outputs JSON schemas

### LiamDB Executor
- Uses Liam's internal AI agent for schema generation
- Designed for complex, multi-step schema design workflows

## Evaluation

The evaluation computes comprehensive metrics for each dataset:
- Table F1 Score: Harmonic mean of table precision and recall
- Table Recall: Fraction of reference tables recovered
- Table All Correct Rate: Percentage of perfectly matched tables
- Column F1 Score Average: Average F1 across table columns
- Column Recall Average: Fraction of reference columns recovered
- Column All Correct Rate Average: Percentage of perfectly matched columns
- Foreign Key F1 Score: F1 score for foreign key relationships
- Foreign Key Recall: Fraction of reference foreign keys recovered
- Foreign Key All Correct Rate: Percentage of perfectly matched foreign keys

## Schema Format

Schemas use the structured format from `@liam-hq/schema/schema`:

```typescript
type Schema = {
  tables: Record<string, Table>
}

type Table = {
  name: string
  columns: Record<string, Column>
  constraints: Record<string, Constraint>
}
```

### Example: Simple Products Table

```json
{
  "tables": {
    "products": {
      "name": "products",
      "columns": {
        "id": {
          "name": "id",
          "type": "INTEGER",
          "primary": true,
          "notNull": true,
          "comment": "Product ID"
        },
        "name": {
          "name": "name",
          "type": "VARCHAR(255)",
          "notNull": true,
          "comment": "Product name"
        }
      },
      "comment": "Products table",
      "constraints": {
        "pk_products": {
          "type": "PRIMARY KEY",
          "name": "pk_products",
          "columnName": "id"
        }
      }
    }
  }
}
```

## Workspace Structure

After `setupWorkspace`, the workspace contains dataset directories under `benchmark-workspace/`:

```
benchmark-workspace/
├── default/
│   ├── execution/
│   │   ├── input/      # JSON prompt files
│   │   ├── output/     # Generated schemas
│   │   └── reference/  # Reference schemas for comparison
│   └── evaluation/     # Evaluation results (per-case + summary)
├── entity-extraction/
    ├── execution/
    │   ├── input/
    │   ├── output/
    │   └── reference/
    └── evaluation/
└── relational-inference/
    ├── execution/
    │   ├── input/
    │   ├── output/
    │   └── reference/
    └── evaluation/
```

## Environment Setup

For OpenAI executor, set your API key:
```bash
export OPENAI_API_KEY="your-api-key"
```

### Required: Enable LangSmith tracing

Schema-Bench requires LangSmith tracing for both executors. Runs will fail fast if tracing is not enabled.

Set the following environment variables:

- `LANGSMITH_API_KEY` (required)
- One of `LANGCHAIN_TRACING_V2=true`, `LANGSMITH_TRACING=true`, or `SCHEMA_BENCH_TRACE=1` (required)
- `LANGSMITH_PROJECT=schema-bench` (optional, recommended)
- `LANGSMITH_ORGANIZATION_ID` and `LANGSMITH_PROJECT_ID` (optional, for UI search URLs)

Example:
```bash
export LANGSMITH_API_KEY="your-langsmith-api-key"
export LANGSMITH_PROJECT="schema-bench"
export LANGCHAIN_TRACING_V2=true
```

Notes:
- LiamDB executor uses LangChain/LangGraph and propagates a per-case `thread_id` as `<dataset>:<case>:<runId>` for easy correlation in LangSmith.
- OpenAI executor records inputs, parsed outputs, and usage where available via the tracer.
- If `LANGSMITH_ORGANIZATION_ID` and `LANGSMITH_PROJECT_ID` are set, the CLI prints a search URL to jump directly to the traces for a given `thread_id`.

## Example Workflow

1) Clean and setup: `rm -rf benchmark-workspace && pnpm --filter @liam-hq/schema-bench setupWorkspace`
2) Execute (LiamDB): `pnpm --filter @liam-hq/schema-bench executeLiamDB -all`
   or Execute (OpenAI): `pnpm --filter @liam-hq/schema-bench executeOpenai -all`
3) Evaluate: `pnpm --filter @liam-hq/schema-bench evaluateSchemaMulti`

## Use Cases

- Model comparison across datasets
- Quality assurance for schema generation
- Repeatable benchmarking with standardized metrics
