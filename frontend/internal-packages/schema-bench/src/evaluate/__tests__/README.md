# Evaluate Tests

## Foreign Key Tests

The foreign key evaluation tests are currently skipped because the `evaluate` function implementation does not properly calculate foreign key F1 scores. The tests expect:

- When schemas have matching foreign keys, `foreignKeyF1Score` should be 1
- When schemas have partial foreign key matches, `foreignKeyF1Score` should be between 0 and 1
- When schemas have no foreign key matches, `foreignKeyF1Score` should be 0

However, the current implementation always returns 0 for schemas that contain foreign keys.

To fix this, the `evaluate` function needs to be updated to properly:
1. Extract foreign key constraints from the schema
2. Compare foreign key relationships between reference and predicted schemas
3. Calculate F1 scores based on the matches

Once the implementation is fixed, remove the `.skip` from the foreign key tests in `evaluate.foreign-keys.test.ts`.