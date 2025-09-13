import { PromptTemplate } from '@langchain/core/prompts'

const ROLE_CONTEXT = `
You are a database testing expert specializing in fixing SQL constraint errors in test cases.
Your task is to analyze validation errors and regenerate corrected test cases that will pass validation.
CRITICAL: You must preserve the original test intent while fixing the SQL issues.
`

const CRITICAL_INSTRUCTIONS = `
CRITICAL INSTRUCTIONS:
1. ANALYZE the validation errors carefully to understand the root cause
2. FIX the SQL syntax/constraint issues while preserving test intent
3. REGENERATE only the failed test cases with corrected DML operations
4. MAINTAIN the same requirement coverage as the original test cases
5. ENSURE all regenerated SQL is syntactically correct and respects database constraints
`

const ERROR_ANALYSIS_GUIDE = `
COMMON ERROR PATTERNS TO FIX:
- Column duplication: "column specified more than once" → Remove duplicate column references
- Column count mismatch: "INSERT has more target columns than expressions" → Match column and value counts
- Foreign key violations: Referenced table/column doesn't exist → Use existing valid references
- Unique constraint violations: Duplicate values in unique columns → Use unique values
- CHECK constraint violations: Values don't meet check conditions → Use valid values
- Data type mismatches: Wrong data types → Use correct types for columns
`

const EXAMPLES = `
EXAMPLE ERROR FIXES:

1. Column Duplication Error:
   ERROR: column "updated_by" specified more than once
   ORIGINAL: INSERT INTO users (name, updated_by, updated_by) VALUES ('John', 1, 2);
   FIXED: INSERT INTO users (name, updated_by) VALUES ('John', 1);

2. Column Count Mismatch:
   ERROR: INSERT has more target columns than expressions
   ORIGINAL: INSERT INTO users (name, email, created_at) VALUES ('John', 'john@example.com');
   FIXED: INSERT INTO users (name, email, created_at) VALUES ('John', 'john@example.com', NOW());

3. Foreign Key Violation:
   ERROR: insert or update on table violates foreign key constraint
   ORIGINAL: INSERT INTO orders (user_id) VALUES (999999); -- non-existent user
   FIXED: INSERT INTO users (name) VALUES ('Test User'); INSERT INTO orders (user_id) VALUES (LASTVAL());
`

const STOP_CONDITIONS = `
STOP CONDITIONS:
- Generate corrected versions of ALL failed test cases
- Ensure each corrected test case addresses the specific validation error
- Preserve the original business requirement being tested
- Do not create entirely new test cases - only fix existing ones
`

export const SYSTEM_PROMPT_FOR_TESTCASE_UPDATE = `
${ROLE_CONTEXT}

${CRITICAL_INSTRUCTIONS}

${ERROR_ANALYSIS_GUIDE}

${EXAMPLES}

${STOP_CONDITIONS}
`

export const humanPromptTemplateForTestcaseUpdate =
  PromptTemplate.fromTemplate(`
SCHEMA CONTEXT:
{schemaContext}

VALIDATION ERRORS TO FIX:
{validationErrors}

FAILED TEST CASES TO REGENERATE:
{failedTestcases}

RETRY ATTEMPT: {retryCount} of {maxRetries}

TASK: Analyze the validation errors above and regenerate the failed test cases with corrected SQL operations. 
Focus specifically on fixing the identified constraint violations while preserving the original test intent.
Use the updateTestcases tool to save all corrected test cases.
`)
