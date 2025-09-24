# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- pnpm dev - Start dev servers
- cd frontend/apps/app && pnpm dev - Start dev server for specific package
- pnpm build - Build all packages
- pnpm lint - Run linting and formatting
- pnpm test - Run tests
- pnpm fmt - Run format code

### App-specific Commands

```bash
# Run only the main web app (port 3001)
pnpm --filter @liam-hq/app dev

# Format code
pnpm --filter @liam-hq/agent fmt

# Test
pnpm --filter @liam-hq/agent test
```

## Architecture

### Monorepo Structure

- **frontend/apps/app** - Main Next.js web application (`@liam-hq/app`)
- **frontend/apps/docs** - Documentation site (`@liam-hq/docs`)
- **frontend/packages/cli** - Command-line tool (`@liam-hq/cli`)
- **frontend/packages/erd-core** - Core ERD visualization (`@liam-hq/erd-core`)
- **frontend/packages/schema** - Database schema parser (`@liam-hq/schema`)
- **frontend/packages/ui** - UI component library (`@liam-hq/ui`)
- **frontend/packages/github** - GitHub API integration (`@liam-hq/github`)

### Key Technologies

- **Frontend**: React 19, Next.js 15, TypeScript
- **Styling**: CSS Modules with typed definitions
- **Visualization**: @xyflow/react (React Flow)
- **Validation**: Valibot for runtime type validation
- **Build**: Turborepo, pnpm workspaces

## Development Guidelines

### Core Principle: **Less is more**

Keep every implementation as small and obvious as possible.

- **Let the code speak** – If you need a multi-paragraph comment, refactor until intent is obvious
- **Delete fearlessly, Git remembers** – Cut dead code, stale logic, and verbose history

### TypeScript Standards

- Use runtime type validation with `valibot` for external data validation
- Use early returns for readability

### Code Editing

- Write simple, direct code without backward compatibility concerns - update all call sites together

```typescript
// ❌ Bad: Optional parameter leads to conditional logic
function saveUser(data: UserData, userId?: string) {
  const id = userId || generateId(); // Unnecessary fallback logic
  if (!userId) console.warn("Using generated ID"); // Extra handling
  return db.save(id, data);
}

// ✅ Good: Required parameter, update all callers
function saveUser(data: UserData, userId: string) {
  return db.save(userId, data); // Simple and clear
}
```

### Component Patterns

- Use named exports only (no default exports)
- Event handlers should be prefixed with "handle" (e.g., `handleClick`)
- Use CSS Modules for all styling
- Import UI components from `@liam-hq/ui` when available
- Import icons from `@liam-hq/ui`

### File Organization

- Don't code directly in `page.tsx` - create separate page components
- Follow existing import patterns and tsconfig paths
- Use consts instead of functions: `const toggle = () => {}`

### Data Fetching

- Server Components for server-side data fetching
- Client-side fetching only when necessary
- Align data fetching responsibilities with component roles
- Use Server Actions for all data mutations (create, update, delete operations)

### CSS

- Use CSS Variables from `@liam-hq/ui` package
- Generate CSS type definitions with `pnpm gen:css`
- Use CSS variables according to their intended purpose. Spacing variables should be used exclusively for margins and padding, while height and width specifications should use appropriate units (rem, px, etc.)

## Pull Requests

When creating pull requests, refer to @.github/pull_request_template.md for the required information and format.
