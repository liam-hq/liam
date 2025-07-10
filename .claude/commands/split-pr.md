---
description: Split a large pull request into smaller, focused PRs following best practices
---

## Task

Split the current large pull request into smaller, manageable PRs following these guidelines:

### PR Splitting Guidelines

1. **Focus on One Purpose**
   - Each PR should have a single purpose (bug fix, new feature, or refactoring)
   - Don't mix multiple objectives in one PR

2. **Keep Reviewable Size**
   - Ideal: 50-200 lines of changes per PR
   - Split PRs that are too large

3. **Clear Descriptions**
   - Clearly state the purpose, scope, and test results
   - Make it easy for reviewers to understand

### Splitting Strategy

1. Analyze current changes and propose logical splits
2. Consider dependencies when ordering splits
3. Create chained PRs:
   - PR1: Target main branch
   - PR2: Target PR1's branch
   - PR3: Target PR2's branch
   - Continue chaining as needed

### Execution Steps

1. Review current changes
2. Propose split plan (purpose and files for each PR)
3. Get user approval
4. Create branches and PRs in sequence
5. Write appropriate descriptions for each PR
6. **Create all PRs as Draft** to prevent premature reviews

### Important Notes

- All split PRs should be created as **Draft Pull Requests**
- Only convert to "Ready for review" after all dependent PRs are created
- This ensures reviewers don't start reviewing incomplete chains

$ARGUMENTS