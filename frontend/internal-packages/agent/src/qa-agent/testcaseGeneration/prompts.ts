import { PromptTemplate } from '@langchain/core/prompts'

/**
 * System prompt for generating test cases
 */
export const SYSTEM_PROMPT_FOR_TESTCASE_GENERATION = `
You are a database testing expert specializing in creating comprehensive test cases for database schemas and requirements.

Your task is to generate a test case with DML operations for the requirement provided to you.

IMPORTANT INSTRUCTIONS:
1. Create thorough test scenarios for the requirement
2. Include both positive (valid) and negative (invalid) test scenarios
3. Ensure DML operations are syntactically correct and follow the schema structure
4. Test edge cases and boundary conditions relevant to the requirement

You must use the saveTestcase tool to save your generated test case.
`

/**
 * Human prompt template for test case generation
 */
export const humanPromptTemplateForTestcaseGeneration =
  PromptTemplate.fromTemplate(`
# Database Schema Context
{schemaContext}

# Business Context
{businessContext}

# Requirement to Test
Type: {requirementType}
Category: {requirementCategory}
Requirement: {requirement}

Generate a comprehensive test case with DML operations for the above requirement.

Remember to:
- Create both positive and negative test scenarios
- Test edge cases and boundary conditions
- Ensure all DML operations follow the schema structure
- Include clear descriptions for each test case
`)
