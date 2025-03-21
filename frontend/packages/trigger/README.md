# @liam-hq/trigger

This package contains trigger.dev job definitions and utilities for the Liam project. It encapsulates the workflow for processing pull requests, generating reviews, and posting comments.

## Installation

Since this is a workspace package, you can include it in your project as follows:

```bash
pnpm add @liam-hq/trigger@workspace:*
```

## Available Jobs

The package provides the following trigger.dev jobs:

### Review Workflow

The review workflow consists of the following tasks:

1. `savePullRequestTask`: Saves pull request information to the database
2. `generateReviewTask`: Generates a review for the pull request
3. `saveReviewTask`: Saves the generated review to the database
4. `postCommentTask`: Posts the review as a comment on GitHub

### Hello World

A simple hello world task for testing the trigger.dev setup.

## Usage Example

### Setting up in a Next.js app

1. Create a trigger.dev client:

```typescript
// app/api/trigger/route.ts
import { createAppRoute } from '@trigger.dev/nextjs'
import { TriggerClient } from '@trigger.dev/sdk'
 
export const triggerClient = new TriggerClient({
  id: 'your-client-id',
  apiKey: process.env.TRIGGER_API_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
})
 
export const { POST, dynamic } = createAppRoute(triggerClient)
```

2. Import and use the tasks:

```typescript
// app/api/trigger/jobs.ts
import { triggerClient } from '../route'
import { createReviewTasks } from '@liam-hq/trigger'
import { githubAPI, githubClientFactory } from '../../libs/github'

// Initialize review tasks with dependencies
const reviewTasks = createReviewTasks({
  githubAPI,
  githubClientFactory,
})

// Register tasks with trigger client
triggerClient.defineJob({
  id: 'pull-request-review',
  name: 'Pull Request Review',
  version: '1.0.0',
  trigger: {
    // Define your trigger here
  },
  run: async (payload, io) => {
    // Use the tasks here
    await reviewTasks.savePullRequestTask.run(payload, io)
  },
})
```

### Manual Triggering

You can also trigger tasks manually:

```typescript
import { createReviewTasks } from '@liam-hq/trigger'

const reviewTasks = createReviewTasks({
  githubAPI,
  githubClientFactory,
})

await reviewTasks.savePullRequestTask.trigger({
  pullRequestNumber: 123,
  pullRequestTitle: 'Update schema',
  projectId: 456,
  owner: 'liam-hq',
  name: 'liam',
  repositoryId: 789,
})
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Watch for changes
pnpm dev
```

## Deployment

This package is automatically deployed when changes are made to the repository. The deployment is handled by the GitHub Actions workflow defined in `.github/workflows/trigger_dev_staging.yml`. 