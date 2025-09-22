---
description: Convert JSON benchmark datasets back to schema files
---

# Deparse Dataset to Schema

## Task

Convert a JSON schema dataset to a schema file in the specified format using @liam-hq/schema deparser functionality.

### Process

1. Read the JSON dataset from the specified input path
2. Use @liam-hq/schema's `postgresqlSchemaDeparser` function to convert JSON to SQL DDL
3. Save the generated schema file to the specified output path
4. Verify the generated schema is valid and properly formatted

### Arguments

$ARGUMENTS

Expected arguments:

- Input JSON file path - path to the JSON schema dataset to convert
- Output file path - where to save the generated schema file
- Format (optional - currently supports postgres, defaults to postgres)

Example usage:
`/deparse-dataset-to-schema frontend/internal-packages/schema-bench/benchmark-workspace-default/execution/reference/case-001.json schema.sql`
`/deparse-dataset-to-schema data/case-002.json output/schema.sql --format postgres`
`/deparse-dataset-to-schema ./my-schema.json generated-schema.sql`
