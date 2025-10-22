# Database Linting with Splinter

This directory contains the Splinter database linter integration for continuous database schema quality checks.

## Overview

[Splinter](https://github.com/supabase/splinter) is a PostgreSQL linter developed by Supabase that identifies common database schema issues including:

- **Security Issues**: Exposed auth.users, RLS configuration problems
- **Performance Issues**: Unindexed foreign keys, inefficient RLS policies, unused indexes
- **Best Practices**: Missing primary keys, duplicate indexes, security definer views

## Files

- `splinter.sql` - The Splinter lint query (union of all 15+ lint rules)
- `run-splinter.sh` - Shell script to execute Splinter and format results
- `README.md` - This documentation

## Usage

### Local Execution

To run Splinter lints locally against your Supabase database:

```bash
# Set your database connection string
export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Run the linter
./scripts/db-lint/run-splinter.sh
```

### CI Integration

The linter runs automatically in CI via the `.github/workflows/database-lint.yml` workflow:

**Triggers:**
- Pull requests that modify database schema files
- Weekly scheduled runs (Sundays at 00:00 UTC)
- Manual workflow dispatch

**Behavior:**
- **ERROR level issues**: Fail the CI check
- **WARN level issues**: Pass with warnings (configurable)
- **INFO level issues**: Pass with informational messages

## Lint Rules

Splinter includes 15+ lint rules organized by category:

### Security Rules

1. **0002_auth_users_exposed** (ERROR)
   - Detects if `auth.users` is exposed to anon/authenticated roles
   - Critical security issue that could leak user credentials

### Performance Rules

1. **0001_unindexed_foreign_keys** (INFO)
   - Foreign keys without covering indexes
   - Can cause slow queries and table scans

2. **0003_auth_rls_initplan** (WARN)
   - RLS policies that re-evaluate `auth.*()` functions for each row
   - Causes significant performance degradation at scale
   - **Fix**: Wrap auth functions in subqueries: `(SELECT auth.uid())`

3. **0005_unused_index** (INFO)
   - Indexes that have never been used
   - Waste storage and slow down writes

4. **0006_multiple_permissive_policies** (WARN)
   - Multiple permissive RLS policies for same role/action
   - Each policy must be evaluated, reducing performance

5. **0009_duplicate_index** (INFO)
   - Redundant indexes covering the same columns

### Best Practice Rules

1. **0004_no_primary_key** (INFO)
   - Tables without primary keys
   - Makes replication and updates inefficient

2. **0007_policy_exists_rls_disabled** (WARN)
   - RLS policies defined but RLS not enabled
   - Policies have no effect

3. **0008_rls_enabled_no_policy** (WARN)
   - RLS enabled but no policies defined
   - Blocks all access

4. **0010_security_definer_view** (WARN)
   - Views with SECURITY DEFINER that may bypass RLS

5. **0011_function_search_path_mutable** (WARN)
   - Functions with mutable search_path
   - Security vulnerability

6. **0013_rls_disabled_in_public** (WARN)
   - Public schema tables without RLS
   - Potential security issue

7. **0014_extension_in_public** (WARN)
   - Extensions installed in public schema
   - Should use dedicated schema

8. **0015_rls_references_user_metadata** (WARN)
   - RLS policies referencing `user_metadata`
   - User-controlled data in security policies

## Interpreting Results

### Output Format

The script outputs issues in a human-readable format:

```
[ERROR] Exposed Auth Users
  View "user_profiles" in the public schema may expose `auth.users` data to anon or authenticated roles.
  📖 Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0002_auth_users_exposed

[WARN] Auth RLS Initialization Plan
  Table `public.posts` has a row level security policy `user_posts` that re-evaluates current_setting() or auth.<function>() for each row.
  📖 Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan
```

### Exit Codes

- `0` - No issues or only INFO/WARN level issues
- `1` - ERROR level issues found (CI will fail)

### Summary

At the end of execution, a summary is displayed:

```
========================================
Summary:
  Errors: 0
  Warnings: 2
  Info: 5
========================================
```

## Common Issues and Fixes

### Issue: Auth RLS InitPlan (0003)

**Problem**: RLS policy evaluates `auth.uid()` for every row

```sql
-- ❌ Bad: Evaluated for each row
CREATE POLICY "user_posts" ON posts
  FOR SELECT USING (user_id = auth.uid());
```

**Solution**: Wrap in subquery to evaluate once

```sql
-- ✅ Good: Evaluated once per query
CREATE POLICY "user_posts" ON posts
  FOR SELECT USING (user_id = (SELECT auth.uid()));
```

### Issue: Unindexed Foreign Keys (0001)

**Problem**: Foreign key without index causes slow joins

```sql
-- ❌ Missing index on user_id
ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);
```

**Solution**: Add covering index

```sql
-- ✅ Add index
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

### Issue: Multiple Permissive Policies (0006)

**Problem**: Multiple policies for same role/action

```sql
-- ❌ Two policies for SELECT
CREATE POLICY "policy1" ON posts FOR SELECT USING (published = true);
CREATE POLICY "policy2" ON posts FOR SELECT USING (user_id = auth.uid());
```

**Solution**: Combine into single policy

```sql
-- ✅ Single policy with OR condition
CREATE POLICY "posts_select" ON posts FOR SELECT 
  USING (published = true OR user_id = auth.uid());
```

## Customization

### Adjusting Failure Threshold

To make WARN level issues fail CI, modify `run-splinter.sh`:

```bash
# Change this section:
if [ "${WARN_COUNT}" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Database lint completed with warnings${NC}"
  exit 1  # Change from exit 0 to exit 1
fi
```

### Excluding Specific Lints

To exclude specific lint rules, modify `splinter.sql` to filter by `name`:

```sql
-- Add WHERE clause to exclude specific lints
WHERE name NOT IN ('unused_index', 'no_primary_key')
```

### Adding Custom Lints

You can add custom lint rules by appending to `splinter.sql`:

```sql
UNION ALL
(
  SELECT
    'custom_lint_name' as name,
    'Custom Lint Title' as title,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    'Description of the issue' as description,
    format('Detailed message: %s', table_name) as detail,
    'https://your-docs.com/lint' as remediation,
    jsonb_build_object('schema', schema_name, 'name', table_name) as metadata,
    format('custom_lint_%s_%s', schema_name, table_name) as cache_key
  FROM your_custom_query
)
```

## Maintenance

### Updating Splinter

To update to the latest Splinter version:

```bash
# Clone the latest Splinter
git clone https://github.com/supabase/splinter.git /tmp/splinter

# Copy the updated SQL file
cp /tmp/splinter/splinter.sql scripts/db-lint/splinter.sql

# Test locally
export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
./scripts/db-lint/run-splinter.sh
```

### Monitoring

The workflow runs weekly to catch schema drift. Review the results in:

- GitHub Actions workflow runs
- Uploaded artifacts (splinter-lint-results)
- PR comments (for pull request runs)

## Resources

- [Splinter GitHub Repository](https://github.com/supabase/splinter)
- [Splinter Documentation](https://supabase.github.io/splinter)
- [Supabase Database Linter Guide](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Troubleshooting

### Script fails with "DATABASE_URL not set"

Ensure the `DATABASE_URL` environment variable is set:

```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

### psql command not found

Install PostgreSQL client:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

### Permission denied when running script

Make the script executable:

```bash
chmod +x scripts/db-lint/run-splinter.sh
```

### False positives

Some lint rules may not apply to your use case. You can:

1. Document exceptions in your schema
2. Exclude specific lints (see Customization section)
3. Adjust the failure threshold for WARN/INFO levels
