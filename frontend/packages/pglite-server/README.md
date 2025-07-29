# @liam-hq/pglite-server

A TypeScript ESM package that provides PGlite database instance management with immediate cleanup after query execution.

## Installation

```bash
pnpm add @liam-hq/pglite-server
```

## Usage

```typescript
import { executeQuery, pgliteManager } from '@liam-hq/pglite-server'

// Execute a SQL query
const results = await executeQuery('session-id', 'SELECT * FROM users')

// Access the manager directly
const customResults = await pgliteManager.executeQuery('session-id', 'CREATE TABLE test (id SERIAL)')
```

## ESM Configuration

This package is configured as an **ESM module** with TypeScript source files that compile to JavaScript.

### For JavaScript/Node.js consumers:
- Use the built JavaScript files from `dist/` (automatically resolved via `package.json` main field)
- Standard ESM imports work out of the box

### For TypeScript consumers:
- TypeScript will automatically resolve `.js` imports to the corresponding `.ts` source files during compilation
- No special configuration needed

### For direct TypeScript execution:
If you need to run the raw `.ts` files directly (not recommended for production), use a TypeScript-aware loader:

```bash
# Using tsx
npx tsx your-script.ts

# Using ts-node with ESM support
node --loader ts-node/esm your-script.ts
```

## Build Process

```bash
# Build TypeScript to JavaScript
pnpm build

# Type checking only
pnpm lint:tsc
```

The build process:
1. Compiles `.ts` files to `.js` files in the `dist/` directory
2. Generates `.d.ts` declaration files for TypeScript consumers
3. Preserves `.js` extensions in import/export statements for proper ESM resolution

## API

### `executeQuery(sessionId: string, sql: string): Promise<SqlResult[]>`

Executes SQL queries with automatic instance cleanup.

### `pgliteManager: PGliteInstanceManager`

Direct access to the PGlite instance manager for advanced use cases.

### `PGliteInstanceManager`

The main class that manages PGlite database instances with immediate cleanup after query execution.