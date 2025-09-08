# Quickstart: SQL Syntax Validation Migration

## Overview
This quickstart validates that SQL syntax validation has been successfully moved from execution time to DML generation time, following the feature requirements.

## Prerequisites
- Development environment set up with the monorepo
- QA agent workflow accessible for testing
- Test database or mock setup for DML operations

## Test Scenario 1: Valid SQL Generation and Execution

### Setup
```bash
# Navigate to the QA agent directory
cd frontend/internal-packages/agent

# Ensure dependencies are installed
pnpm install
```

### Test Steps

1. **Generate Valid DML Operation**
   ```typescript
   // Simulate QA agent generating valid SQL
   const validDmlOperation = {
     sql: "SELECT * FROM users WHERE active = true;",
     // ... other DML operation fields
   }
   ```

2. **Verify Syntax Validation During Generation**
   - Tool should validate SQL syntax using `pgParse`
   - Validation should pass silently
   - Operation should be saved successfully

3. **Verify Execution Efficiency**
   - Execute the saved DML operation
   - Execution should NOT re-validate syntax (performance improvement)
   - Operation should complete successfully

### Expected Results
- ✅ DML operation saved with syntax validation
- ✅ Execution proceeds without redundant syntax checking  
- ✅ No syntax errors reported during either phase

## Test Scenario 2: Invalid SQL Generation and Error Handling

### Test Steps

1. **Generate Invalid DML Operation**
   ```typescript
   // Simulate QA agent generating invalid SQL
   const invalidDmlOperation = {
     sql: "SELECT * FROM users WHERE active =;",  // Missing value
     // ... other DML operation fields
   }
   ```

2. **Verify Syntax Validation Failure**
   - Tool should detect syntax error using `pgParse`
   - Validation should fail with clear error message
   - Operation should NOT be saved

3. **Verify Error Message Quality**
   - Error should specify the syntax problem
   - Error should include position information if available
   - Error should provide actionable feedback for AI model

### Expected Results
- ❌ DML operation rejected due to syntax error
- ✅ Clear, actionable error message provided
- ✅ No invalid operations saved to state

## Test Scenario 3: Retry Mechanism

### Test Steps

1. **Simulate Multiple Validation Attempts**
   ```typescript
   // Attempt 1: Invalid SQL
   const attempt1 = {
     sql: "SELECT * FROM users WHERE;"  // Invalid WHERE clause
   }
   
   // Attempt 2: Still invalid SQL  
   const attempt2 = {
     sql: "SELECT * FROM users WHERE active"  // Missing comparison
   }
   
   // Attempt 3: Valid SQL
   const attempt3 = {
     sql: "SELECT * FROM users WHERE active = true;"
   }
   ```

2. **Verify Retry Behavior**
   - Each attempt should be validated independently
   - Failed attempts should provide error feedback
   - Third attempt should succeed and save operation

3. **Verify Retry Limit Enforcement**
   - If 3 attempts fail, no more retries should be allowed
   - Final error should indicate maximum attempts reached

### Expected Results
- ✅ Failed attempts provide error feedback without saving
- ✅ Successful attempt saves operation
- ✅ Maximum retry limit (3) enforced

## Test Scenario 4: Backward Compatibility

### Test Steps

1. **Test Existing Valid Operations**
   - Load previously saved DML operations (without syntax validation flag)
   - Execute operations through existing execution path
   - Verify operations continue to work

2. **Test Execution Fallback**
   - Simulate operation that bypasses generation-time validation
   - Execution path should still validate syntax as fallback
   - Invalid operations should be caught and handled

### Expected Results
- ✅ Existing operations continue to work without modification
- ✅ Execution fallback provides safety net for edge cases
- ✅ No breaking changes to existing workflows

## Performance Validation

### Test Steps

1. **Measure Generation Time Impact**
   - Generate multiple DML operations with syntax validation
   - Compare timing to baseline (if available)
   - Verify acceptable performance impact

2. **Measure Execution Time Improvement**
   - Execute pre-validated DML operations
   - Verify reduced execution time due to skipped syntax checking
   - Confirm performance improvement realized

### Expected Results
- ✅ Generation time impact within acceptable bounds
- ✅ Execution time improved due to eliminated redundant validation
- ✅ Overall user experience improvement achieved

## Integration Validation

### Test Steps

1. **End-to-End QA Agent Workflow**
   - Run complete QA agent workflow with DML generation
   - Verify syntax validation integrated seamlessly
   - Confirm error handling works in full context

2. **Error Propagation Testing**
   - Generate invalid SQL through agent workflow
   - Verify error messages propagate correctly to user interface
   - Confirm regeneration prompts work as expected

### Expected Results
- ✅ Full workflow operates with syntax validation
- ✅ Error messages reach user interface appropriately
- ✅ AI model receives feedback for regeneration attempts

## Success Criteria

### Functional Requirements Validated
- [x] **FR-001**: SQL syntax validated during DML generation
- [x] **FR-002**: Clear error messages provided for validation failures
- [x] **FR-003**: Invalid SQL prevented from being saved  
- [x] **FR-004**: AI model regeneration supported through error feedback
- [x] **FR-005**: Backward compatibility maintained for existing operations
- [x] **FR-007**: Retry logic implemented with 3-attempt maximum
- [x] **FR-008**: SQL execution flow simplified by removing redundant checks
- [x] **FR-009**: Error message consistency preserved across validation points
- [x] **FR-010**: Immediate feedback provided for syntax errors

### User Experience Improvements
- ✅ Earlier error detection improves development efficiency
- ✅ Clear error messages enable faster problem resolution
- ✅ Reduced execution time improves overall performance
- ✅ Consistent error handling improves reliability

## Troubleshooting

### Common Issues

**Validation Not Working**
- Verify `@liam-hq/schema/parser` dependency is available
- Check `pgParse` import and usage
- Confirm tool schema includes validation logic

**Error Messages Not Clear**
- Verify error formatting utility is being used
- Check error message extraction from `pgParse` results
- Confirm error context includes relevant SQL snippet

**Performance Issues**
- Monitor validation timing for large SQL operations
- Consider timeout handling for complex parsing
- Verify no memory leaks in validation process

**Retry Mechanism Problems**
- Check retry count tracking in workflow
- Verify maximum attempt enforcement
- Confirm error messages indicate retry status

This quickstart validates all major aspects of the SQL syntax validation migration, ensuring the feature meets requirements and provides the expected user experience improvements.