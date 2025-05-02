# Technical Context

## Technologies Used
- **AI Components**: Utilized for analyzing migration impacts and providing intelligent suggestions.
- **LangChain**: Framework for developing applications powered by language models, used for AI review generation and schema override suggestions. The project uses LangChain's ChatOpenAI integration for all prompt generators.
- **OpenAI**: Provider of AI models used for generating schema reviews and schema override suggestions. The project specifically uses the 'o3-mini-2025-01-31' model for all prompt generators.
- **Trigger.dev**: Task orchestration platform used for implementing the review pipeline and knowledge suggestion tasks.
- **GitHub App**: Integrated to automate comments and review approvals on PRs, with enhanced API usage for fetching PR descriptions and comments.
- **Supabase JS**: JavaScript client for Supabase, used for database access with support for optimized queries using nested joins.
- **Supabase RPC**: Remote Procedure Call functionality in Supabase, planned for future implementation of robust transaction management across the application.
- **AWS**: Deployed in the us-east-1 region for its high affinity with English-speaking markets and potential for future multi-region expansion.
- **TypeScript**: Strongly-typed programming language that builds on JavaScript.
- **React 18**: UI library for building component-based interfaces.
- **Next.js 15**: React framework for server-rendered applications.
- **Vite**: Build tool used in CLI for static site generation.
- **Valtio**: State management.
- **@xyflow/react (React Flow)**: Diagram visualization.
- **Fumadocs**: Documentation site.
- **CSS Modules**: For styling HTML elements with typed definitions.
- **Radix UI**: For UI primitives.
- **Lucide React**: For consistent iconography.

## Development Setup
- The product is integrated with existing development workflows through its GitHub App, allowing for seamless automation and review processes.
- The system is designed to be modular, enabling easy integration and extension of features.
- **Task Pipeline**: A series of tasks are chained together using Trigger.dev to form a complete review workflow, including schema override generation.
- **Function Separation**: Business logic is separated into dedicated function files that are called from task definitions.
- **Type Safety**: When working with Supabase, type assertions are used to bridge the gap between Supabase's types and the application's expected types, particularly for nested queries and bigint fields.
- **Enhanced Prompt Structure**: AI prompts are structured to incorporate multiple sources of context, including PR descriptions, comments, documentation, schema files, and code changes. For schema override generation, prompts include the current schema override file content to enable incremental improvements rather than generating from scratch.
- **Package Management**: pnpm for efficient dependency management.
- **Monorepo Management**: pnpm workspaces.
- **Build System**: Turborepo for optimized builds.
- **Linting & Formatting**: 
  - Biome for code quality and formatting
  - `pnpm fmt` command to format code according to project standards
  - `pnpm lint` command to check for code quality issues and type errors
- **Testing**: Vitest for unit testing, Playwright for e2e testing.
  - **Supabase Testing Approach**: A direct testing approach is used with Supabase. We create real records in the database, run the actual functions with these records, and then clean up the test data afterwards. This provides more realistic tests that verify the actual functions with real database interactions, leveraging Supabase's ability to be executed directly in test environments.

## Database Migration Workflow

### Migration Documentation

The project maintains two key documents for database migrations:

1. **Migration Operations Context** (`docs/migrationOpsContext.md`): Provides detailed guidance on the migration workflow, deployment system, key constraints, and SQL guidelines for creating migrations. This document explains how our project uses Supabase Branching for database migration management and outlines important safety practices.

2. **Schema Patterns** (`docs/schemaPatterns.md`): Defines reusable patterns and rules for database schema design, including naming conventions, structural modeling patterns, and preferred types. This document ensures consistency in database design across the project.

These documents should be consulted when creating or reviewing database migrations to ensure adherence to project standards and best practices.

### Schema Enhancements

Recent schema enhancements include:

1. **knowledge_suggestions Reasoning Field**: Added a `reasoning` TEXT field to the knowledge_suggestions table to store the rationale behind schema override update suggestions. This helps users understand the context and reasoning behind suggestions, enabling more informed decisions when approving them.

### Supabase Migration Workflow

The migration workflow follows Supabase's recommended practices. All Supabase migration commands must be run from the `frontend/packages/db` directory:

1. **Creating a new migration**:
   ```bash
   cd frontend/packages/db && pnpm supabase:migration:new <migration_name>
   ```
   This creates a new migration file in `supabase/migrations` directory.

2. **Adding SQL to the migration file**:
   Edit the generated migration file to include the necessary SQL statements for schema changes.

3. **Applying migrations**:
   ```bash
   cd frontend/packages/db && pnpm supabase:migration:up
   ```
   This applies any pending migrations to the database.

4. **Diffing changes from the Dashboard**:
   If changes are made through the Dashboard UI, they can be captured as migrations:
   ```bash
   cd frontend/packages/db && pnpm supabase:migration -f <migration_name>
   ```
   This generates a migration file with the changes detected between the local database and the schema definition.

5. **Resetting the database**:
   ```bash
   cd frontend/packages/db && pnpm supabase:reset
   ```
   This resets the database to a clean state, reapplies all migrations, and seeds the database.

### Seeding Data

Seed data can be defined in `supabase/seed.sql`. This file is executed when resetting the database with `pnpm supabase:reset`.

### Type Safety

After schema changes, regenerate TypeScript types and SQL schema:
```bash
cd frontend/packages/db && pnpm supabase:gen
```
This ensures type safety when working with Supabase queries, and generates the SQL schema for the database.

## Code Implementation Guidelines
- Use TypeScript for all components and functions.
- Use early returns whenever possible to make the code more readable.
- Always use CSS Modules for styling HTML elements.
- Use descriptive variable and function/const names. Event functions should be named with a "handle" prefix.
- Implement accessibility features on elements.
- Use consts instead of functions (e.g., "const toggle = () =>") and define types when possible.
- Do not code within the `page.tsx` file in Next.js App Router. Instead, create a separate `XXXPage` component.
- Follow the `tsconfig.json` paths settings and always use the correct alias for import paths.
- Align data fetching responsibilities with the component's role (server vs. client-side).

## Component Implementation Guidelines
- Avoid using `default export`; always use `named export`.
- When styling, prioritize using CSS Variables from the `@liam-hq/ui` package.
- Prefer using UI components provided by `@liam-hq/ui` over custom implementations.
- When using icons, always import them from `@liam-hq/ui`.
- When implementing designs from Figma using the Figma MCP tool, always reference 'frontend/packages/ui/src/styles/Dark/variables.css' for colors, padding, gap, spacing, and borderRadius values.
- When specifying colors, prioritize semantic color definitions (e.g., --primary-accent, --global-foreground) and avoid using --color- prefixed variables whenever possible.

## Technical Constraints
- The product must coexist with its OSS version, offering high-value features in paid plans to ensure a sustainable business model.
- The AI components require continuous learning from past reviews to improve accuracy and relevance over time.
- Type compatibility issues with Supabase require careful handling, particularly for bigint fields and nested relationships.
- Schema override generation requires accurate analysis of database schema changes and proper integration with the knowledge suggestion system.
- Supabase types need to be updated whenever database schema changes are made, to maintain type safety across the application.

## Dependencies
- **AWS**: Used for deployment, with a focus on the us-east-1 region.
- **GitHub**: Essential for integration and automation of review processes.
- **AI Services**: Required for the intelligent analysis and suggestion features.
- **Vercel**: Deployment of web applications.
- **GitHub Actions**: CI/CD for continuous integration.
