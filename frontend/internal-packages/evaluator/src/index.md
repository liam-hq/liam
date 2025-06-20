# Database Schema Evaluator Package

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
- Calculates Longest Common Substring (LCS) for character-level similarity
- Handles variations in naming conventions (e.g., camelCase vs snake_case)

## Evaluation Metrics

The evaluator produces the following key metrics:

### Schema-Level Metrics
- **Schema F1 Score**: Harmonic mean of precision and recall for schema name matching
- **Schema All-Correct Rate**: Binary indicator of perfect schema name matching

### Attribute-Level Metrics
- **Attribute F1 Average**: Average F1 score across all matched schemas
- **Attribute All-Correct Average**: Average all-correct rate for attribute matching

### Structural Metrics
- **Primary Key Average**: Accuracy rate for primary key prediction
- **Foreign Key Average**: Accuracy rate for foreign key prediction
- **Schema All-Correct Full**: Overall completeness indicator combining all metrics

## Input Schema Format

The evaluator processes JSON schemas with the following structure:

```json
{
  "SchemaName": {
    "Attributes": ["attribute1", "attribute2", "attribute3"],
    "Primary key": ["primary_key_field"],
    "Foreign key": {
      "foreign_key_field": {
        "ReferencedSchema": "referenced_field"
      }
    }
  }
}
```

### Real-World Example

Here's a complete example from an insurance company database schema:

```json
{
  "Insurance Agent": {
    "Attributes": ["Agent ID", "Name", "Hire Date", "Contact Phone"],
    "Primary key": ["Agent ID"],
    "Foreign key": {}
  },
  "Customer": {
    "Attributes": ["Customer ID", "Name", "ID Card Number", "Contact Phone"],
    "Primary key": ["Customer ID"],
    "Foreign key": {}
  },
  "Insurance Policy": {
    "Attributes": [
      "Policy ID",
      "Agent ID", 
      "Customer ID",
      "Insurance Type",
      "Insured Amount",
      "Insurance Term",
      "Premium"
    ],
    "Primary key": ["Policy ID"],
    "Foreign key": {
      "Agent ID": {"Insurance Agent": "Agent ID"},
      "Customer ID": {"Customer": "Customer ID"}
    }
  },
  "Payment Record": {
    "Attributes": [
      "Policy ID",
      "Payment Amount",
      "Payment Date", 
      "Payment Method"
    ],
    "Primary key": ["Policy ID"],
    "Foreign key": {"Policy ID": {"Insurance Policy": "Policy ID"}}
  },
  "Claim Record": {
    "Attributes": ["Policy ID", "Claim Amount", "Claim Date"],
    "Primary key": ["Policy ID"],
    "Foreign key": {"Policy ID": {"Payment Record": "Policy ID"}}
  },
  "Medical Record": {
    "Attributes": ["Customer ID", "Visit Time", "Visit Cost"],
    "Primary key": ["Customer ID", "Visit Time"],
    "Foreign key": {"Customer ID": {"Customer": "Customer ID"}}
  }
}
```

### Schema Structure Explanation

- **Schema Names**: Top-level keys represent table/entity names (e.g., "Insurance Agent", "Customer")
- **Attributes**: Array of column/field names within each schema
- **Primary Key**: Array of fields that form the primary key (supports composite keys)
- **Foreign Key**: Object mapping foreign key fields to their referenced schema and field
  - Format: `"foreign_field": {"ReferencedSchema": "referenced_field"}`
  - Empty object `{}` indicates no foreign key relationships

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

This evaluator package serves as a critical component for ensuring the quality and accuracy of automated database schema generation systems, providing detailed insights into both the strengths and weaknesses of prediction models.
