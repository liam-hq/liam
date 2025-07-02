import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Include existing test configurations
  'frontend/apps/app/vitest.config.ts',
  'frontend/internal-packages/app-ui/vitest.config.ts',
  'frontend/internal-packages/jobs/vitest.config.ts',
  'frontend/packages/erd-core/vitest.config.ts',
  'frontend/packages/db-structure/vitest.config.ts',
  'frontend/packages/cli/vitest.config.ts',
  'frontend/packages/ui/vitest.config.ts',
  // Add Storybook test configuration
  'frontend/internal-packages/storybook/vitest.config.ts',
])