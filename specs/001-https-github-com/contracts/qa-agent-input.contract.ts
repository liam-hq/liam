/**
 * QA Agent Input Contract
 *
 * Defines the expected input structure for QA agent when processing testcases.
 * This contract validates that QA agent receives properly structured requirements.
 */

import * as v from 'valibot';
import { requirementsSchema, testcaseSchema } from './pm-agent-output.contract';

/**
 * QA Agent Input Schema
 * The input state that QA agent expects to receive
 */
export const qaAgentInputSchema = v.object({
  requirements: requirementsSchema,
  // Other state fields may be present
});

/**
 * Testcase Validation for QA Processing
 * Additional validation rules specific to QA agent execution
 */
export const qaProcessingTestcaseSchema = v.pipe(
  testcaseSchema,
  v.check(
    (testcase) => testcase.type in ['INSERT', 'UPDATE', 'DELETE', 'SELECT'],
    'Testcase type must be a valid SQL operation'
  ),
  v.check(
    (testcase) => testcase.sql.trim().length > 0,
    'SQL must not be empty or whitespace-only'
  )
);

// Type exports
export type QAAgentInput = v.InferOutput<typeof qaAgentInputSchema>;
export type QAProcessingTestcase = v.InferOutput<typeof qaProcessingTestcaseSchema>;

/**
 * Validation function for QA agent input
 */
export function validateQAAgentInput(input: unknown): QAAgentInput {
  return v.parse(qaAgentInputSchema, input);
}

/**
 * Validation function for individual testcase before QA processing
 */
export function validateTestcaseForQA(testcase: unknown): QAProcessingTestcase {
  return v.parse(qaProcessingTestcaseSchema, testcase);
}

/**
 * Validate all testcases before QA processing
 */
export function validateTestcasesForQA(testcases: unknown[]): QAProcessingTestcase[] {
  return testcases.map((tc) => validateTestcaseForQA(tc));
}
