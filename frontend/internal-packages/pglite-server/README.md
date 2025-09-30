# PGlite Server

Internal package for executing SQL queries using PGlite (PostgreSQL in WebAssembly).

## Configuration

### Environment Variables

- `PGLITE_POOL_SIZE`: Number of PGlite instances in the pool (default: 3)
  - Set to 3 for CI/test environments (faster initialization)
  - Set to 8 for production (better parallelism)
  - Example: `PGLITE_POOL_SIZE=8 pnpm dev`

## Features

- Instance pooling with round-robin distribution
- Transaction isolation for DML statements
- Extension support and filtering
- Parallel query execution

## Memory Usage

Each PGlite instance uses approximately 256MB of memory. Plan accordingly:
- 3 instances: ~768MB base memory
- 8 instances: ~2GB base memory