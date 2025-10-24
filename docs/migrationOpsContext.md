# Migration Operations Context

Our project uses Supabase Branching for database migration management. This system integrates with our GitHub repository and automatically applies migrations when pull requests are merged to the main branch.

## Deployment System

- Supabase Branching automatically runs migrations when PRs merge to main.
- Migrations in `frontend/internal-packages/db/supabase/migrations` run sequentially by timestamp.

## Key Constraints

- No guaranteed order between app deployments and migrations.
- Either app (`@liam-hq/app`) or migrations may complete first.
- Migrations must be backward compatible with the previous app version.
- App must work with both old and new database schema.

## Branching Workflow

- Preview branches created automatically for PRs.
- Each commit with migration changes triggers runs on preview instance.
- Schema drift possible between multiple preview branches.

## Safety Practices

- Test all migrations thoroughly in preview branches.
- Design for race conditions between app and database deployments.
- Keep migrations small and focused.
- Regularly merge from main to prevent schema divergence.
- Monitor PR comments for deployment status.

## Schema Drift Prevention

Schema drift occurs when production database changes don't match Git migration files (e.g., manual changes via Dashboard).

**Prevention:**
- ✅ Always use migration files for schema changes
- ✅ Create migrations: `pnpm supabase:migration -f <name>`
- ✅ Update types after: `pnpm supabase:gen`
- ❌ Never modify schema directly in Dashboard/SQL console

**Resolution:**
If drift detected, sync production schema to Git:
```bash
cd frontend/internal-packages/db
supabase link --project-ref <project_ref>
supabase db pull --linked
# Review generated migration, commit, and create PR
```

**Automated Detection:**
Daily CI checks (9:00 JST) compare production with `main` branch, Slack alerts on drift. See `.github/workflows/check-schema-drift.yml`.

## Create migration

This project uses the migrations provided by the Supabase CLI.

### Prerequisites

Before working with migrations, ensure the Supabase local environment is running:

```bash
# Navigate to the database package
cd frontend/internal-packages/db

# Check current status
pnpm supabase status

# Start local development environment if not running
pnpm supabase:start
```

### Creating a migration file

Given the context of the user's message, create a database migration file inside the folder `frontend/internal-packages/db/supabase/migrations/`.

The file MUST following this naming convention:

The file MUST be named in the format `YYYYMMDDHHmmss_short_description.sql` with proper casing for months, minutes, and seconds in UTC time:

1. `YYYY` - Four digits for the year (e.g., `2024`).
2. `MM` - Two digits for the month (01 to 12).
3. `DD` - Two digits for the day of the month (01 to 31).
4. `HH` - Two digits for the hour in 24-hour format (00 to 23).
5. `mm` - Two digits for the minute (00 to 59).
6. `ss` - Two digits for the second (00 to 59).
7. Add an appropriate description for the migration.

For example:

```
20240906123045_create_profiles.sql
```

## SQL Guidelines

Write Postgres-compatible SQL code for Supabase migration files that:

- Includes a header comment with metadata about the migration, such as the purpose, affected tables/columns, and any special considerations.
- Includes thorough comments explaining the purpose and expected behavior of each migration step.
- Write all SQL in lowercase.
- Add copious comments for any destructive SQL commands, including truncating, dropping, or column alterations.
- **Follow the schema design patterns and rules documented in [`docs/schemaPatterns.md`](./schemaPatterns.md)** for consistent database design.
- **Wrap migrations in a transaction (BEGIN/COMMIT) to ensure atomicity**. This prevents partial migrations if an error occurs.

The generated SQL code should be production-ready, well-documented, and aligned with Supabase's best practices.

## Adding NOT NULL Constraints

When adding a NOT NULL constraint to an existing column:

1. Always update existing rows with appropriate values before applying the constraint.
2. For columns with foreign key references, derive values from related tables when possible.
3. Example approach:

```sql
BEGIN;

-- Add the column as nullable first
ALTER TABLE "public"."table_name"
ADD COLUMN "new_column" uuid REFERENCES "public"."referenced_table"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Update existing rows with values from a related table
UPDATE "public"."table_name" tn
SET "new_column" = (
  SELECT rt."id"
  FROM "public"."referenced_table" rt
  JOIN "public"."join_table" jt ON rt."id" = jt."referenced_id"
  WHERE jt."table_id" = tn."id"
  LIMIT 1
);

-- Now make the column NOT NULL
ALTER TABLE "public"."table_name"
ALTER COLUMN "new_column" SET NOT NULL;

COMMIT;
```

## Applying Migrations

After creating a migration file, apply it to the local database:

```bash
# Navigate to the database package
cd frontend/internal-packages/db

# Apply pending migrations
pnpm supabase:migration:up

# Alternative: Reset database and apply all migrations from scratch
pnpm supabase:reset
```

## Post-Migration Steps

After applying migrations, always run:

1. Run the combined command to update both schema SQL file and TypeScript types:

   ```sh
   cd frontend/internal-packages/db && pnpm supabase:gen
   ```

2. Test affected functionality to ensure backward compatibility with the previous app version.

3. Update all test files that might be affected by schema changes, especially where strict typing is enforced.
