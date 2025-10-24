# Database Linting with Splinter

This directory hosts the Splinter lint integration used to protect the Supabase schema that lives in `@liam-hq/db`.

## Files

- `splinter.sql` – collection of the official Splinter rules (15+ checks)
- `run-splinter.sh` – thin wrapper that runs the query, formats the output, and exposes debug helpers
- `README.md` – this guide

## Running Locally

```bash
cd frontend/internal-packages/db
pnpm supabase:start                               # boots the local Supabase stack
SPLINTER_DEBUG=1 pnpm db:lint                     # DATABASE_URL defaults to the local stack
pnpm supabase:stop                                # optional: shut the stack down afterwards
```

To invoke the linter from the workspace root, use:

```bash
SPLINTER_DEBUG=1 pnpm -F @liam-hq/db db:lint
```

Tips:
- Set `SPLINTER_DEBUG=1` to print the raw row count, the first five rows, and a hex dump of the first row for troubleshooting.
- Override `DATABASE_URL` if you need to lint a different database instance.

## CI Integration

Splinter runs as part of `.github/workflows/database-ci.yml` on every pull request that touches the database package. Currently, ERROR, WARN, and INFO findings all fail the job and block the build.
