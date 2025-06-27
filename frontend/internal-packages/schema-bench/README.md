# Schema-Bench Package

## Overview

The Database Schema Evaluator package provides a comprehensive evaluation framework for assessing the accuracy of predicted database schemas against reference schemas. This package is designed to evaluate schema prediction models, tools, or automated database design systems by comparing their outputs with ground truth schemas.

## Core Functionality

The evaluator performs multi-dimensional analysis across several key areas:

### 1. Schema Name Matching
- **Word Overlap Matching**: Identifies schemas with shared words or lexical similarities
- **Semantic Similarity Matching**: Uses machine learning embeddings to find semantically related schema names
- **Comprehensive Mapping**: Creates bidirectional mappings between reference and predicted schema names

### 2. Attribute-Level Evaluation
- **Attribute Name Matching**: Applies the same matching techniques to individual table attributes
- **Precision and Recall Calculation**: Measures how well predicted attributes match reference attributes
- **F1 Score Computation**: Provides balanced accuracy metrics for attribute matching

### 3. Structural Validation
- **Primary Key Validation**: Verifies that predicted primary keys match reference primary keys
- **Foreign Key Validation**: Checks foreign key relationships and constraints
- **Schema Completeness**: Evaluates overall structural accuracy

## Architecture

The package consists of three main components:

### evaluate.ts
The main evaluation orchestrator that:
- Coordinates the entire evaluation process
- Integrates results from different matching algorithms
- Calculates comprehensive metrics including F1 scores, precision, recall, and all-correct rates
- Produces detailed evaluation reports

### nameSimilarity.ts
Semantic matching engine that:
- Utilizes Hugging Face Transformers library with the 'all-MiniLM-L6-v2' model
- Generates text embeddings for schema and attribute names
- Calculates cosine similarity scores between embeddings
- Identifies semantically related terms that may not share exact words

### wordOverlapMatch.ts
Lexical matching engine that:
- Performs word tokenization and stop word removal
- Detects exact word overlaps between names
- Handles variations in naming conventions (e.g., camelCase vs snake_case)

## Evaluation Metrics

The evaluator produces the following key metrics:

### Schema-Level Metrics
- **Schema F1 Score**: Harmonic mean of precision and recall for schema name matching
- **Schema All-Correct Rate**: Binary indicator of perfect schema name matching

### Attribute-Level Metrics
- **Attribute F1 Average**: Average F1 score across all matched schemas
- **Attribute All-Correct Average**: Average all-correct rate for attribute matching

### Structural Metrics (TODO)
- **Primary Key Average**: Accuracy rate for primary key prediction
- **(TODO)Foreign Key Average**: Accuracy rate for foreign key prediction
- **Schema All-Correct Full**: Overall completeness indicator combining all metrics

## Input Schema Format

The evaluator processes database schemas using the structured format defined in `@liam-hq/db-structure/schema`. The schema follows a comprehensive structure that includes tables and table groups:

```typescript
type Schema = {
  tables: Record<string, Table>
  tableGroups: Record<string, TableGroup>
}

type Table = {
  name: string
  columns: Record<string, Column>
  comment: string | null
  indexes: Record<string, Index>
  constraints: Record<string, Constraint>
}

type Column = {
  name: string
  type: string
  default: string | number | boolean | null
  check: string | null
  primary: boolean
  unique: boolean
  notNull: boolean
  comment: string | null
}
```

### Real-World Example

Here's a complete example from an insurance company database schema:

```json
{
  "tables": {
    "insurance_agent": {
      "name": "insurance_agent",
      "columns": {
        "agent_id": {
          "name": "agent_id",
          "type": "VARCHAR(50)",
          "default": null,
          "check": null,
          "primary": true,
          "unique": false,
          "notNull": true,
          "comment": "Unique identifier for insurance agent"
        },
        "name": {
          "name": "name",
          "type": "VARCHAR(100)",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": true,
          "comment": "Agent full name"
        },
        "hire_date": {
          "name": "hire_date",
          "type": "DATE",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": true,
          "comment": "Date when agent was hired"
        },
        "contact_phone": {
          "name": "contact_phone",
          "type": "VARCHAR(20)",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": false,
          "comment": "Agent contact phone number"
        }
      },
      "comment": "Insurance agents information",
      "indexes": {},
      "constraints": {
        "pk_insurance_agent": {
          "type": "PRIMARY KEY",
          "name": "pk_insurance_agent",
          "columnName": "agent_id"
        }
      }
    },
    "customer": {
      "name": "customer",
      "columns": {
        "customer_id": {
          "name": "customer_id",
          "type": "VARCHAR(50)",
          "default": null,
          "check": null,
          "primary": true,
          "unique": false,
          "notNull": true,
          "comment": "Unique identifier for customer"
        },
        "name": {
          "name": "name",
          "type": "VARCHAR(100)",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": true,
          "comment": "Customer full name"
        },
        "id_card_number": {
          "name": "id_card_number",
          "type": "VARCHAR(20)",
          "default": null,
          "check": null,
          "primary": false,
          "unique": true,
          "notNull": true,
          "comment": "Customer ID card number"
        },
        "contact_phone": {
          "name": "contact_phone",
          "type": "VARCHAR(20)",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": false,
          "comment": "Customer contact phone"
        },
        "agent_id": {
          "name": "agent_id",
          "type": "VARCHAR(50)",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": true,
          "comment": "Reference to insurance agent"
        }
      },
      "comment": "Customer information",
      "indexes": {},
      "constraints": {
        "pk_customer": {
          "type": "PRIMARY KEY",
          "name": "pk_customer",
          "columnName": "customer_id"
        },
        "uk_customer_id_card": {
          "type": "UNIQUE",
          "name": "uk_customer_id_card",
          "columnName": "id_card_number"
        },
        "fk_customer_agent": {
          "type": "FOREIGN KEY",
          "name": "fk_customer_agent",
          "columnName": "agent_id",
          "targetTableName": "insurance_agent",
          "targetColumnName": "agent_id",
          "updateConstraint": "CASCADE",
          "deleteConstraint": "RESTRICT"
        }
      }
    },
    "policy": {
      "name": "policy",
      "columns": {
        "policy_id": {
          "name": "policy_id",
          "type": "VARCHAR(50)",
          "default": null,
          "check": null,
          "primary": true,
          "unique": false,
          "notNull": true,
          "comment": "Unique identifier for policy"
        },
        "customer_id": {
          "name": "customer_id",
          "type": "VARCHAR(50)",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": true,
          "comment": "Reference to customer"
        },
        "agent_id": {
          "name": "agent_id",
          "type": "VARCHAR(50)",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": true,
          "comment": "Reference to insurance agent"
        },
        "policy_type": {
          "name": "policy_type",
          "type": "VARCHAR(50)",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": true,
          "comment": "Type of insurance policy"
        },
        "premium_amount": {
          "name": "premium_amount",
          "type": "DECIMAL(10,2)",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": true,
          "comment": "Monthly premium amount"
        },
        "start_date": {
          "name": "start_date",
          "type": "DATE",
          "default": null,
          "check": null,
          "primary": false,
          "unique": false,
          "notNull": true,
          "comment": "Policy start date"
        }
      },
      "comment": "Insurance policy information",
      "indexes": {},
      "constraints": {
        "pk_policy": {
          "type": "PRIMARY KEY",
          "name": "pk_policy",
          "columnName": "policy_id"
        },
        "fk_policy_customer": {
          "type": "FOREIGN KEY",
          "name": "fk_policy_customer",
          "columnName": "customer_id",
          "targetTableName": "customer",
          "targetColumnName": "customer_id",
          "updateConstraint": "CASCADE",
          "deleteConstraint": "CASCADE"
        },
        "fk_policy_agent": {
          "type": "FOREIGN KEY",
          "name": "fk_policy_agent",
          "columnName": "agent_id",
          "targetTableName": "insurance_agent",
          "targetColumnName": "agent_id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "RESTRICT"
        }
      }
    }
  }
}
```

### Schema Structure Explanation

- **Tables**: Record of table definitions with detailed column specifications
  - **Columns**: Detailed column definitions including type, constraints, and metadata
  - **Constraints**: Primary key, foreign key, unique, and check constraints
  - **Indexes**: Database indexes for performance optimization
  - **Comments**: Documentation for tables and columns

## Usage Workflow

1. **Input Preparation**: Provide reference schemas and predicted schemas in the JSON format shown above
2. **Multi-Stage Matching**: The system applies word overlap matching followed by semantic similarity matching
3. **Comprehensive Evaluation**: All aspects (names, attributes, keys) are evaluated systematically
4. **Metric Calculation**: Detailed metrics are computed and returned in a structured format

## Key Features

- **Multi-Algorithm Approach**: Combines lexical and semantic matching for robust name resolution
- **Hierarchical Evaluation**: Evaluates both schema-level and attribute-level accuracy
- **Flexible Thresholds**: Configurable similarity thresholds for different matching algorithms
- **Comprehensive Metrics**: Provides both granular and aggregate evaluation metrics
- **Performance Optimized**: Efficient algorithms for handling large schema sets

## Use Cases

- **Model Evaluation**: Assess the performance of database schema generation models
- **Tool Comparison**: Compare different automated database design tools
- **Quality Assurance**: Validate schema predictions in production systems
- **Research**: Support academic research in database design automation
- **Benchmarking**: Create standardized evaluation benchmarks for schema prediction tasks

This package serves as a critical component for ensuring the quality and accuracy of automated database schema generation systems, providing detailed insights into both the strengths and weaknesses of prediction models.
