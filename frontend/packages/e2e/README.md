# e2e

This package is for running end-to-end (E2E) tests using [Playwright](https://playwright.dev/).  
It allows us to automatically test different parts of our application, including UI changes using **Visual Regression Testing (VRT)**.

## Running Tests Locally

### Run E2E Tests &  Visual Regression Tests
To execute E2E tests locally, use the following command:

```bash
pnpm test:e2e
```

This command runs all end-to-end tests and checks for unexpected UI changes using snapshot comparisons.

### Updating Visual Regression Snapshots

When running VRT for the first time, or when intentionally modifying the UI, you need to update the snapshot images.

For example:

```bash
URL=http://localhost:5173 pnpm playwright test tests/vrt --update-snapshots
```

This will update the baseline images used for comparison.

## GitHub Actions Workflow

E2E tests, including VRT, are also executed automatically on GitHub Actions.
If a VRT test fails, it means the UI has changed.

### Handling VRT Failures

### 1. Download the failed test results
If the test fails in GitHub Actions, find the "Upload test results" link in the Action log.

![upload test results](https://github.com/user-attachments/assets/631dc80c-1a34-43a7-bca8-ef833edddd51)

### 2. Check the actual screenshot

Compare ``top-actual.png`` with the expected UI.

### 3. Update the baseline if the change is intentional

- If top-actual.png matches the intended UI change, rename it to:

```
top-1-chromium-linux.png
```

- Place it in the following directory:

```
frontend/packages/e2e/tests/vrt/vrt.test.ts-snapshots/
```

- Commit and push the updated snapshot.



### 4. Re-run the tests

Ensure the updated test now passes.
