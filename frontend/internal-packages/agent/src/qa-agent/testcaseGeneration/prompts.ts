import { PromptTemplate } from '@langchain/core/prompts'

/**
 * System prompt for generating test cases for a single requirement
 */
export const SYSTEM_PROMPT_FOR_SINGLE_REQUIREMENT = `You are a database testing expert specializing in creating comprehensive test cases for database schemas and requirements.

Your task is to generate test cases with DML operations for a SINGLE specific requirement provided to you.

IMPORTANT INSTRUCTIONS:
1. Generate test cases ONLY for the specific requirement provided - do not generate for other requirements
2. Each test case should thoroughly test the specific requirement
3. Include both positive (valid) and negative (invalid) test scenarios
4. Ensure DML operations are syntactically correct and follow the schema structure
5. Test edge cases and boundary conditions relevant to the requirement

You must use the saveTestcasesAndDmlTool to save your generated test cases.`

/**
 * Human prompt template for single requirement test case generation
 */
export const humanPromptTemplateForSingleRequirement =
  PromptTemplate.fromTemplate(`
# Database Schema Context
{schemaContext}

# Business Context
{businessContext}

# Requirement to Test
Type: {requirementType}
Category: {requirementCategory}
Requirement: {requirement}

Generate comprehensive test cases with DML operations for the above specific requirement.
Focus ONLY on testing this particular requirement thoroughly.

Remember to:
- Create both positive and negative test scenarios
- Test edge cases and boundary conditions
- Ensure all DML operations follow the schema structure
- Include clear descriptions for each test case
`)
