# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- Build: `pnpm build` (builds all packages)
- Dev: `pnpm dev` (runs dev servers)
- Lint: `pnpm lint` (runs all linters)
- Format: `pnpm fmt` (formats all code)
- Test: `pnpm test` (runs all tests)
- Single test: `cd frontend/apps/app && pnpm vitest [testname]`

## Coding Standards

- Use TypeScript with strict typing
- Format with Biome (no semicolons, single quotes)
- Use CSS Modules for styling with proper type definitions
- For React components:
  - Use named exports (avoid default exports)
  - Use CSS variables from @liam-hq/ui
  - Use functional components with hooks
  - Name event handlers with "handle" prefix (e.g., handleClick)
  - Implement proper accessibility features
- Use database types from `@liam-hq/db/supabase/database.types` for database entities
- Avoid type assertions (`as`), use Valibot for runtime validation
- Use early returns for cleaner code
- Do not code within page.tsx files - create separate components
- Delegate data fetching to server components when possible
- For icons, always import from @liam-hq/ui
- Use proper semantic color variables (e.g., --primary-accent) instead of --color- variables
- Use font-size variables (e.g., --font-size-3) instead of hardcoded pixel values
