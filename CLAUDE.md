# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Liam ERD is a database schema visualization tool that generates beautiful, interactive ER diagrams. The project consists of a web application, CLI tool, and multiple supporting packages in a pnpm monorepo structure.

## Essential Commands

### Development
```bash
# Start development servers
pnpm dev

# Build all packages
pnpm build

# Run linting and formatting
pnpm lint
pnpm fmt

# Run tests
pnpm test
pnpm test:e2e

# Generate code and CSS type definitions
pnpm gen:turbo
```

### App-specific Development
```bash
# Run only the main web app (port 3001)
cd frontend/apps/app && pnpm dev

# Run with CSS generation
cd frontend/apps/app && pnpm dev:css

# Type checking
cd frontend/apps/app && pnpm lint:tsc
```

### Package Management
```bash
# Install dependencies
pnpm install

# Add dependency to specific package
pnpm add <package> --filter @liam-hq/app

# Run command in specific workspace
pnpm --filter @liam-hq/cli build
```

### Database Operations
For database migration and type generation workflows, see [`docs/migrationOpsContext.md`](docs/migrationOpsContext.md).

### Schema Changes
- Always use the following migration workflow:
  1. `pnpm -F db supabase:migration:new <MIGRATION_NAME>`
  2. Write DDL in the generated migration file
  3. `pnpm -F db supabase:migration:up` to apply changes
  4. `pnpm -F db supabase:gen` to regenerate type definitions

## Architecture

### Monorepo Structure
- **frontend/apps/app** - Main Next.js web application (`@liam-hq/app`)
- **frontend/apps/docs** - Documentation site (`@liam-hq/docs`)
- **frontend/packages/cli** - Command-line tool (`@liam-hq/cli`)
- **frontend/packages/erd-core** - Core ERD visualization (`@liam-hq/erd-core`)
- **frontend/packages/db-structure** - Database schema parser (`@liam-hq/db-structure`)
- **frontend/packages/ui** - UI component library (`@liam-hq/ui`)
- **frontend/packages/github** - GitHub API integration (`@liam-hq/github`)
- **frontend/packages/jobs** - Background jobs with Trigger.dev (`@liam-hq/jobs`)

### Key Technologies
- **Frontend**: React 18, Next.js 15, TypeScript
- **Styling**: CSS Modules with typed definitions
- **Visualization**: @xyflow/react (React Flow)
- **State**: Valtio for state management
- **Validation**: Valibot for runtime type validation
- **Build**: Turborepo, pnpm workspaces
- **Jobs**: Trigger.dev for background processing

### Data Flow
1. Schema files are parsed by `@liam-hq/db-structure`
2. ERD visualization is handled by `@liam-hq/erd-core` using React Flow
3. UI components from `@liam-hq/ui` provide consistent design
4. GitHub integration via `@liam-hq/github` for PR reviews
5. Background jobs in `@liam-hq/jobs` handle async operations

## Development Guidelines

### TypeScript Standards
- Use runtime type validation with `valibot` for external data validation
- Use early returns for readability

### Code Editing
- When modifying existing code, write the ideal state without worrying about backward compatibility
- Don't maintain redundant code for the sake of compatibility
- Focus on clean, optimal implementation

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

### CSS
- Use CSS Variables from `@liam-hq/ui` package
- Generate CSS type definitions with `pnpm gen:css`
- Watch mode available with `pnpm dev:css`
- Use CSS variables according to their intended purpose. Spacing variables should be used exclusively for margins and padding, while height and width specifications should use appropriate units (rem, px, etc.)

## Pull Requests
When creating pull requests, refer to @.github/pull_request_template.md for the required information and format.

## Important Files
- `frontend/apps/docs/content/docs/contributing/repository-architecture.mdx` - Detailed package structure
- `.cursorrules` - Contains detailed coding standards and guidelines
- `turbo.json` - Build system configuration
- `biome.jsonc` - Linting and formatting configuration
- `.github/pull_request_template.md` - Pull request template
