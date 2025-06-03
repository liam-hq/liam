# @liam-hq/prompt-test

## What is this?

Testing for `@liam-hq/jobs` prompts.

## Features

- Runtime environments
  - [x] CI (GitHub Actions)
  - [x] Local development
- Langfuse integration
  - [x] `Tracing`
  - [x] `Dataset`, `Dataset Items`
    - Automatically syncs YAML fixtures from `src/fixtures/` to Langfuse dataset items
  - [x] `Evaluation` and `Templates`
- Supported `@liam-hq/jobs` prompts
  - [x] generateReview
  - [ ] generateDocsSuggestion
  - [ ] generateSchemaOverride

## Usage

Run the test suite:

```bash
pnpm --filter=@liam-hq/prompt-test test
```

## Test Structure

Tests are defined in YAML fixtures located in `src/fixtures/`. Each test fixture contains:
- Test name
- Input variables
- Assertions for validation

## Development

To add new test cases:
1. Create a new YAML fixture in `src/fixtures/`
2. Define the test inputs and assertions
3. Run the test suite to validate the changes
