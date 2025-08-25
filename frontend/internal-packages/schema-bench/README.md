# Schema-Bench Package

## Overview

Schema-Bench is a comprehensive benchmarking tool for database schema generation and evaluation. It provides executors for generating schemas using different AI models and tools for evaluating their accuracy against reference schemas.

## Quick Start

### 1. Setup Workspace
```bash
pnpm --filter @liam-hq/schema-bench setupWorkspace
```
Creates the benchmark directory structure with input, output, and reference folders.

### 2. Create Input Cases
Add JSON files to `benchmark-workspace/execution/input/` with your schema generation prompts:
```json
{
  "input": "Create a products table with id and name columns"
}
```

### 3. Generate Schemas
Choose one of the available executors:

**OpenAI Executor:**
```bash
pnpm --filter @liam-hq/schema-bench executeOpenai
```

**LiamDB Executor:**
```bash
pnpm --filter @liam-hq/schema-bench executeLiamDB
```

### 4. Evaluate Results
```bash
pnpm --filter @liam-hq/schema-bench evaluateSchema
```

## Available Commands

| Command | Description |
|---------|-------------|
| `setupWorkspace` | Initialize benchmark directory structure |
| `executeOpenai` | Generate schemas using OpenAI API |
| `executeLiamDB` | Generate schemas using Liam's AI agent |
| `evaluateSchema` | Evaluate generated schemas against references |

## Executors

### OpenAI Executor
- Uses OpenAI's GPT models to generate database schemas from natural language prompts
- Requires `OPENAI_API_KEY` environment variable
- Outputs structured schemas in JSON format

### LiamDB Executor  
- Uses Liam's internal AI agent for schema generation
- Leverages deep modeling workflows for comprehensive schema design
- Optimized for complex database requirements

## Evaluation

The evaluation system performs multi-dimensional analysis:

### Matching Algorithms
- **Word Overlap Matching**: Lexical similarity based on shared words
- **Semantic Similarity**: ML embeddings using 'all-MiniLM-L6-v2' model
- **Comprehensive Mapping**: Bidirectional schema and attribute matching

### Key Metrics
- **F1 Score**: Harmonic mean of precision and recall
- **All-Correct Rate**: Binary indicator of perfect matching
- **Structural Validation**: Primary key and foreign key accuracy

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
  // ... other properties
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

After running `setupWorkspace`, the following directory structure is created:

```
benchmark-workspace/
├── execution/
│   ├── input/          # JSON files with prompts
│   └── output/         # Generated schemas
└── evaluation/
    ├── reference/      # Reference schemas for comparison
    └── result/         # Evaluation results
```

## Environment Setup

For OpenAI executor, set your API key:
```bash
export OPENAI_API_KEY="your-api-key"
```

## Example Workflow

1. **Setup**: `pnpm --filter @liam-hq/schema-bench setupWorkspace`
2. **Create input**: Add `case-001.json` with `{"input": "Create a users table"}`
3. **Generate**: `pnpm --filter @liam-hq/schema-bench executeLiamDB`
4. **Evaluate**: `pnpm --filter @liam-hq/schema-bench evaluateSchema`

## Use Cases

- **Model Comparison**: Compare OpenAI vs LiamDB schema generation
- **Quality Assurance**: Validate schema generation accuracy
- **Benchmarking**: Create standardized evaluation metrics
