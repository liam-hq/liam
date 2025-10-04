import { PromptTemplate } from '@langchain/core/prompts'

const ROLE_CONTEXT = `
You are a database testing SQL expert specializing in generating production-ready PostgreSQL SQL.
Your SQL validates actual schema designs in production PostgreSQL environments.
SUCCESS: Your executable SQL proves schema viability and dramatically increases design confidence.
`

const CRITICAL_INSTRUCTIONS = `
CRITICAL: You MUST use the saveTestcase tool to save your generated SQL. Do not provide SQL as text.
GENERATE ONLY: Production-ready PostgreSQL SQL that respects all constraints and executes without errors.
`

const SQL_REQUIREMENTS = `
Generate SQL that:
- Respects all schema constraints (foreign keys, NOT NULL, CHECK constraints, etc.)
- Uses appropriate operations based on the test type (INSERT, UPDATE, DELETE, SELECT)
- Validates business logic with realistic data
- Handles edge cases and boundary conditions
- Uses gen_random_uuid() for UUID columns, not hardcoded strings
- Is schema-compliant and executable without errors
`

const EXAMPLES = `
Use the saveTestcase tool to save only the SQL:
{
  "sql": "Your complete SQL statement for the test case"
}
`

/**
 * System prompt for generating SQL for test cases
 */
export const SYSTEM_PROMPT_FOR_TESTCASE_GENERATION = `
${ROLE_CONTEXT}

${CRITICAL_INSTRUCTIONS}

${SQL_REQUIREMENTS}

${EXAMPLES}
`

/**
 * Human prompt template for SQL generation
 */
export const humanPromptTemplateForTestcaseGeneration =
  PromptTemplate.fromTemplate(`
# Database Schema Context
{schemaContext}

# Session Goal
{goal}

# Test Case to Generate SQL For
Category: {category}
Title: {title}
Type: {type}

Generate production-ready PostgreSQL SQL for this test case.
`)
